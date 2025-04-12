import { DynamoDBClient, GetItemCommand } from "@aws-sdk/client-dynamodb";
import { unmarshall } from "@aws-sdk/util-dynamodb";

const client = new DynamoDBClient();
const TABLE_NAME = process.env.DYNAMO_TABLE_NAME;
const KEY_NAME = process.env.DYNAMO_KEY_NAME;

export const lambdaHandler = async () => {
  let count = 0;

  try {
    const input = {
      TableName: TABLE_NAME,
      Key: {
        name: { S: KEY_NAME },
      },
    };
    const command = new GetItemCommand(input);
    const responseData = await client.send(command);
    console.log(responseData.Item);
    // DynamoDB JSON => 通常のJSONへ変換
    const item = unmarshall(responseData.Item);
    count = item.count;
  } catch (e) {
    console.error(e);
    return {
      statusCode: 500,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET",
      },
      body: JSON.stringify({
        count: count,
        message: e.message
      }),
    }
  }

  return {
    statusCode: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET",
    },
    body: JSON.stringify({
      count: count,
    }),
  };
};
