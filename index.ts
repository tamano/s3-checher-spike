import Lambda from "aws-lambda"
import * as AWS from "aws-sdk"
 
const config: AWS.S3.Types.ClientConfiguration = {
  endpoint: (process.env.NODE_ENV === "local"? "http://localstack:4572": undefined),
  s3ForcePathStyle: process.env.NODE_ENV === "local",
}
const s3 = new AWS.S3(config)
 
export async function check(event: Lambda.APIGatewayEvent, context: Lambda.Context, callback: Lambda.ProxyCallback) {
  try {

    if(process.env.TARGET_BUCKETS === undefined) {
      callback(null, result_json(false, "バケットを指定してください"))
      return
    }

    var targets:Array<string> = process.env.TARGET_BUCKETS.split(',')
    var has_error:boolean = false
    var results:Array<string> = []

    for (let index = 0; index < targets.length; index++) {
      const target = targets[index]
      var [bucket, prefix] = split_to_bucket_and_prefix(target)

      prefix = (prefix === undefined) ? "" : prefix
  
      var left_objects = await fetch_s3(bucket, prefix)

      var message = "[" + bucket + "/" + prefix + "] "

      // 各種の通知
      if(left_objects.length !== 0){
        if(left_objects instanceof Array){
          message +=　left_objects.length + "個のファイルが残っています！"
        }
        else {
          message += left_objects
        }

        has_error = true

      }
      else{
        message += "エラーはありませんでした"
      }

      results.push(message)
    }

    callback(null, result_json(!has_error, results))

  } catch (e) {
    callback(e, result_json(false, e.message))
  }
}

async function fetch_s3(bucket: string, prefix?: string) {
  var params = {
    Bucket: bucket,
    Prefix: prefix
  }

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

function split_to_bucket_and_prefix(text: string ) {
  return text.split(":")
}

function result_json(succeed: boolean, body: string[] | string ) {
  var result = {
    statusCode: succeed ? 200 : 500,
    body: JSON.stringify({has_error: !succeed, message: body}),
    headers:{
      "Content-Type": "application/json"
    }
  }

  return result
}