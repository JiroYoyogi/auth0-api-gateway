
export const lambdaHandler = async (event, context) => {
  // arn:aws:execute-api:region:account-id:api-id/stage/GET/items/*
  const methodArn = event.methodArn;
  // APIパスに対してAllowする
  return generatePolicy(methodArn, "Allow");
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