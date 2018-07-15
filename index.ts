import Lambda from "aws-lambda"
import * as AWS from "aws-sdk"
 
const config: AWS.S3.Types.ClientConfiguration = {
  endpoint: (process.env.NODE_ENV === "local"? "http://localstack:4572": undefined),
  s3ForcePathStyle: process.env.NODE_ENV === "local",
}
const s3 = new AWS.S3(config)
 
export async function check(event: Lambda.APIGatewayEvent, context: Lambda.Context, callback: Lambda.ProxyCallback) {
  try {
    var params = {
      Bucket: "test-bucket",
      Prefix: ""
    };

    var result = null

    await s3.listObjectsV2(params).promise().then(
      function(data){
        result = data.Contents
      }
    ).catch(
      function(err){
        result = err  
      }
    )

    var result_json = {
      statusCode: 200,
      body: JSON.stringify({
        data: result,
      }),
      headers:{
        "Content-Type": "application/json"
      }
    }

    callback(null, result_json)
  } catch (e) {
    callback(e)
  }
}
