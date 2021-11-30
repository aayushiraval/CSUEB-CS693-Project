## Browser Meeting

### Prerequisites

To build, test, and run the Meeting App from source you will need:

* Node 12 or higher
* npm 6.11 or higher

Ensure you have AWS credentials configured in your `~/.aws` folder for a
role with a policy allowing `chime:CreateMeeting`, `chime:DeleteMeeting`, and
`chime:CreateAttendee`.

If you want to use media capture, the role policy will also
require `chime:CreateMediaCapturePipeline`, `chime:DeleteMediaCapturePipeline`,
and `s3:GetBucketPolicy`.  In addition, ensure that an S3 ARN for a bucket
owned by the same AWS account that your credentials are for should be set in
the `CAPTURE_S3_DESTINATION` environment variable.  The S3 bucket should be in
the same AWS region as the meeting and have the following bucket policy:
```
{
    "Version": "2012-10-17",
    "Id":"AWSChimeMediaCaptureBucketPolicy",
    "Statement": [
        {
            "Sid": "AWSChimeMediaCaptureBucketPolicy",
            "Effect": "Allow",
            "Principal": {
                "Service": "chime.amazonaws.com"
            },
            "Action": ["s3:PutObject", "s3:PutObjectAcl"],
            "Resource":"arn:aws:s3:::[bucket name]/*"
        }
    ]
}
```

### Running the Meeting Application with a local server

1. Navigate to the `meetingApp/browser` folder: `cd meetingApp/browser`

2. Start the meeting application: `npm run start`

3. Open http://localhost:8080 in your browser.

The meeting created with a local server is only available within your browser.