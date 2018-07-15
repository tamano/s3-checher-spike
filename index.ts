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

    var left_objects = await fetch_s3(params)
    console.log(left_objects)


    var result_json = {
      statusCode: 200,
      body: JSON.stringify({
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

async function fetch_s3(params:{Bucket: string }) {
  var result:any = []
  await s3.listObjectsV2(params).promise().then(
    function(data){
      if(data.Contents !== undefined){
        data.Contents.forEach( function(value){
            result.push(value.Key)
        })
      }
    }
  ).catch(
    function(err){
      result = err  
    }
  )

  return result
}