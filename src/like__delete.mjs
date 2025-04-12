import { DynamoDBClient, UpdateItemCommand } from "@aws-sdk/client-dynamodb";
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
      UpdateExpression: "ADD #count :inc",
      ExpressionAttributeNames: {
        "#count": "count",
      },
      ExpressionAttributeValues: {
        ":inc": { N: "-1" },
      },
      ReturnValues: "UPDATED_NEW",
    };
    const command = new UpdateItemCommand(input);
    const responseData = await client.send(command);
    count = unmarshall(responseData.Attributes).count;
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
      "Access-Control-Allow-Methods": "DELETE",
    },
    body: JSON.stringify({
      count: count,
    }),
  };
};
