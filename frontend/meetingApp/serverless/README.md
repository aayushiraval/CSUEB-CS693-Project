## Serverless

This will shows how to deploy the Meeting App as a Serverless Application on AWS.

### Prerequisites

To deploy the serverless app you will need:

- Node 10 or higher
- npm 6.11 or higher

And install aws and sam command line tools:

* [Install the AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/install-cliv1.html)
* [Install the AWS SAM CLI](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/serverless-sam-cli-install.html)

### Run deployment script

#### Meeting app
The following will create a CloudFormation stack containing a Lambda and
API Gateway deployment that runs the `meeting` application.

```
cd meetingApp/serverless
npm install
npm run deploy -- -r us-east-1 -b <my-bucket> -s <my-stack-name> -a meeting
```

### Cleaning up
To avoid incurring any unintended charges as a result of deploying the serverless application, it is important to delete the AWS CloudFormation stack after you are finished using it. You can delete the provisioned CloudFormation stack using the [AWS CloudFormation console](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/cfn-console-delete-stack.html) or the [AWS CLI](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/using-cfn-cli-deleting-stack.html) as well as [delete the S3 buckets](https://docs.aws.amazon.com/AmazonS3/latest/userguide/delete-bucket.html) that were created.