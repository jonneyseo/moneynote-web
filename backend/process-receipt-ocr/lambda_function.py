import json
import boto3
import anthropic
import base64
import os
import re
import io
from PIL import Image
import pillow_heif

pillow_heif.register_heif_opener()

s3_client = boto3.client("s3")

SYSTEM_PROMPT = """You are a receipt parser. Analyze the receipt image and extract structured data.

Return ONLY a valid JSON object with these fields:
{
  "merchant": "full store or restaurant name",
  "date": "YYYY-MM-DD or empty string if not found",
  "total": 0.00,
  "items": [{"name": "full item name", "price": 0.00}],
  "category": "one of: grocery, dining, entertainment, medical, transport, shopping, utilities, other"
}

Rules:
- Expand ALL abbreviations to full English names (e.g. BN → Banana, MLK GAL → Milk Gallon, CHKN BRST → Chicken Breast, ORG → Organic, LG → Large)
- Use the store name/logo visible on the receipt to better interpret store-specific codes
- items should only contain purchased products (exclude tax, tip, subtotal, discount, payment method lines)
- total is the final amount paid (after tax)
- category: grocery=supermarket/food store, dining=restaurant/cafe/fast food, entertainment=movies/games/events, medical=pharmacy/clinic, transport=gas/transit/parking, shopping=retail/clothing/electronics, utilities=bills/services
- Return only the JSON object, no markdown, no explanation"""


def get_image_from_s3(bucket_name, s3_key):
    response = s3_client.get_object(Bucket=bucket_name, Key=s3_key)
    image_bytes = response["Body"].read()
    content_type = response.get("ContentType", "image/jpeg")

    if content_type in ("image/heic", "image/heif"):
        img = Image.open(io.BytesIO(image_bytes))
        buf = io.BytesIO()
        img.convert("RGB").save(buf, format="JPEG", quality=85)
        image_bytes = buf.getvalue()
        content_type = "image/jpeg"

    return base64.standard_b64encode(image_bytes).decode("utf-8"), content_type


def parse_receipt_with_claude(image_b64, content_type):
    client = anthropic.Anthropic(api_key=os.environ.get("ANTHROPIC_API_KEY"))

    response = client.messages.create(
        model="claude-opus-4-6",
        max_tokens=1024,
        system=SYSTEM_PROMPT,
        messages=[
            {
                "role": "user",
                "content": [
                    {
                        "type": "image",
                        "source": {
                            "type": "base64",
                            "media_type": content_type,
                            "data": image_b64,
                        },
                    },
                    {"type": "text", "text": "Parse this receipt."},
                ],
            }
        ],
    )

    text = response.content[0].text.strip()
    # Strip markdown code blocks if present
    if text.startswith("```"):
        text = re.sub(r"^```(?:json)?\s*\n?", "", text)
        text = re.sub(r"\n?```\s*$", "", text)

    return json.loads(text)


def build_response(status_code, body):
    return {
        "statusCode": status_code,
        "headers": {
            "Access-Control-Allow-Origin": "http://localhost:5173",
            "Access-Control-Allow-Headers": "Content-Type",
            "Access-Control-Allow-Methods": "OPTIONS,POST",
        },
        "body": json.dumps(body),
    }


def lambda_handler(event, context):
    try:
        body = json.loads(event.get("body") or "{}")
        bucket_name = body.get("bucket_name")
        s3_key = body.get("s3_key")

        if not bucket_name or not s3_key:
            return build_response(400, {"message": "bucket_name and s3_key are required"})

        image_b64, content_type = get_image_from_s3(bucket_name, s3_key)
        parsed = parse_receipt_with_claude(image_b64, content_type)

        return build_response(200, parsed)

    except json.JSONDecodeError as e:
        return build_response(500, {
            "message": "Claude returned invalid JSON",
            "error": str(e),
        })
    except Exception as e:
        return build_response(500, {
            "message": "Failed to process receipt",
            "error": str(e),
        })
