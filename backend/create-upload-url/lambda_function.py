import json
import os
import uuid
import boto3

s3_client = boto3.client("s3")

BUCKET_NAME = os.environ["UPLOAD_BUCKET_NAME"]


def build_response(status_code, body):
    return {
        "statusCode": status_code,
        "headers": {
            "Access-Control-Allow-Origin": "http://localhost:5500",
            "Access-Control-Allow-Headers": "Content-Type",
            "Access-Control-Allow-Methods": "OPTIONS,POST"
        },
        "body": json.dumps(body)
    }


def lambda_handler(event, context):
    try:
        body = json.loads(event.get("body") or "{}")
        file_name = body.get("file_name")
        content_type = body.get("content_type")

        if not file_name or not content_type:
            return build_response(400, {
                "message": "file_name and content_type are required"
            })

        allowed_types = ["image/jpeg", "image/png", "image/jpg"]

        if content_type not in allowed_types:
            return build_response(400, {
                "message": "Only jpg, jpeg, png files are allowed for now"
            })

        document_id = str(uuid.uuid4())

        extension = file_name.split(".")[-1].lower()
        s3_key = f"uploads/demo_user/{document_id}.{extension}"

        upload_url = s3_client.generate_presigned_url(
            ClientMethod="put_object",
            Params={
                "Bucket": BUCKET_NAME,
                "Key": s3_key,
                "ContentType": content_type
            },
            ExpiresIn=300
        )

        return build_response(200, {
            "document_id": document_id,
            "s3_key": s3_key,
            "upload_url": upload_url
        })

    except Exception as e:
        return build_response(500, {
            "message": "Failed to create upload URL",
            "error": str(e)
        })