import json
import os
import boto3
from datetime import datetime
from decimal import Decimal

dynamodb = boto3.resource("dynamodb")
table = dynamodb.Table(os.environ["TRANSACTIONS_TABLE_NAME"])

ALLOWED_ORIGINS = ["http://localhost:5173", "http://localhost:5500"]


def build_response(status_code, body, origin=""):
    allowed = origin if origin in ALLOWED_ORIGINS else ALLOWED_ORIGINS[0]
    return {
        "statusCode": status_code,
        "headers": {
            "Access-Control-Allow-Origin": allowed,
            "Access-Control-Allow-Headers": "Content-Type",
            "Access-Control-Allow-Methods": "OPTIONS,POST"
        },
        "body": json.dumps(body)
    }


def lambda_handler(event, context):
    origin = event.get("headers", {}).get("origin", "")

    try:
        body = json.loads(event.get("body") or "{}")

        user_id = body.get("user_id", "demo_user")
        document_id = body.get("document_id")
        merchant = body.get("merchant", "")
        date = body.get("date", "")
        total = body.get("total")
        items = body.get("items", [])

        if not document_id:
            return build_response(400, {"message": "document_id is required"}, origin)

        # Sort key: date#document_id (날짜 기준 정렬 가능)
        date_prefix = date.replace("/", "-") if date else datetime.utcnow().strftime("%Y-%m-%d")
        transaction_key = f"{date_prefix}#{document_id}"

        def to_decimal(val):
            try:
                return Decimal(str(val))
            except Exception:
                return val

        serialized_items = [
            {"name": it.get("name", ""), "price": to_decimal(it.get("price", 0))}
            for it in items
        ]

        item = {
            "user_id": user_id,
            "transaction_key": transaction_key,
            "document_id": document_id,
            "merchant": merchant,
            "date": date,
            "total": to_decimal(total) if total is not None else Decimal("0"),
            "items": serialized_items,
            "created_at": datetime.utcnow().isoformat()
        }

        table.put_item(Item=item)

        return build_response(200, {
            "message": "saved",
            "transaction_key": transaction_key
        }, origin)

    except Exception as e:
        return build_response(500, {
            "message": "Failed to save receipt",
            "error": str(e)
        }, origin)
