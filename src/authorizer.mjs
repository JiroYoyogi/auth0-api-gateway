import { TextEncoder } from "util";
import crypto from "crypto";

const auth0Domain = process.env.AUTH0_DOMAIN;
// 公開鍵を取得
const jwks_doc = await fetch(`https://${auth0Domain}/.well-known/jwks.json`);
const jwks = await jwks_doc.json();

// Base64のDecode
const base64UrlDecode = (str) => {
  return Buffer.from(str, "base64").toString("utf8");
};

export const lambdaHandler = async (event, context) => {
  // arn:aws:execute-api:region:account-id:api-id/stage/GET/items/*
  const methodArn = event.methodArn;
  // アクセストークン取得
  const token = event.authorizationToken.split(" ")[1];
  if (!token) {
    return generatePolicy(methodArn, "Deny");
  }

  const [headerB64, payloadB64, signatureB64] = token.split(".");
  const header = JSON.parse(base64UrlDecode(headerB64));
  // 使用している鍵のID
  const kid = header.kid;
  // JWKsと照らして公開鍵を特定
  const key = jwks.keys.find((key) => key.kid === kid);
  if (!key) {
    return generatePolicy(methodArn, "Deny");
  }
  // 証明書から公開鍵を作成
  const publicKey = crypto.createPublicKey({
    key: `-----BEGIN CERTIFICATE-----\n${key.x5c[0]}\n-----END CERTIFICATE-----`,
    format: "pem",
  });
  const data = `${headerB64}.${payloadB64}`;
  const signature = Buffer.from(signatureB64, "base64");
  /**
   * 1. data を sha256 でハッシュ
   * 2. signature を publicKey で復号
   * 3. 両方を比較して、一致していれば true
   */
  const sig_valid = crypto.verify(
    // ★デジタル署名の検証を行う関数
    "sha256",
    new TextEncoder().encode(data), // ハッシュ対象のデータ、文字列 → バイト列
    publicKey, // 検証に使う公開鍵
    signature // 検証対象の署名
  );

  if (!sig_valid) {
    return generatePolicy(methodArn, "Deny");
  }

  const payload = JSON.parse(base64UrlDecode(payloadB64));
  console.log(payload);

  // authorized party Applications ClientID
  // APIを利用するクライアントアプリケーションのチェック
  const clientIdValid = payload["azp"] === process.env.OIDC_CLIENT_ID;

  if (!clientIdValid) {
    return generatePolicy(methodArn, "Deny");
  }

  if (payload["exp"] < new Date().getTime() / 1000) {
    return generatePolicy(methodArn, "Deny");
  }

  const httpMethod = methodArn.split("/")[2];
  const resourcePath = methodArn.split("/").slice(3).join("/");
  // いいねの取り消しの場合はpermissionsをチェックする
  if (resourcePath.startsWith("like") && httpMethod === "DELETE") {
    if(!payload["permissions"].includes("delete:like")) {
      return generatePolicy(methodArn, "Deny");
    }
  }

  return generatePolicy(methodArn, "Allow", payload.sub);
};

const generatePolicy = (methodArn, effect, principalId = "user") => {
  return {
    principalId, // Lambdaを誰が呼んだか
    policyDocument: {
      Version: "2012-10-17",
      Statement: [
        {
          Action: "execute-api:Invoke",
          Effect: effect,
          Resource: methodArn,
        },
      ],
    },
  };
};