import json
import os
import boto3
from boto3.dynamodb.conditions import Key
from decimal import Decimal

dynamodb = boto3.resource("dynamodb")
table = dynamodb.Table(os.environ["TRANSACTIONS_TABLE_NAME"])

ALLOWED_ORIGINS = ["http://localhost:5173", "http://localhost:5500"]


class DecimalEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, Decimal):
            return float(obj)
        return super().default(obj)


def build_response(status_code, body, origin=""):
    allowed = origin if origin in ALLOWED_ORIGINS else ALLOWED_ORIGINS[0]
    return {
        "statusCode": status_code,
        "headers": {
            "Access-Control-Allow-Origin": allowed,
            "Access-Control-Allow-Headers": "Content-Type",
            "Access-Control-Allow-Methods": "OPTIONS,POST,GET"
        },
        "body": json.dumps(body, cls=DecimalEncoder)
    }


def lambda_handler(event, context):
    origin = event.get("headers", {}).get("origin", "")

    try:
        body = json.loads(event.get("body") or "{}")
        user_id = body.get("user_id", "demo_user")

        response = table.query(
            KeyConditionExpression=Key("user_id").eq(user_id),
            ScanIndexForward=False  # newest first
        )

        return build_response(200, {"transactions": response["Items"]}, origin)

    except Exception as e:
        return build_response(500, {
            "message": "Failed to fetch transactions",
            "error": str(e)
        }, origin)
