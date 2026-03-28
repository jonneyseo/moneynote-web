import json
import boto3
import re

textract_client = boto3.client("textract")


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


def extract_lines(textract_response):
    lines = []

    for block in textract_response.get("Blocks", []):
        if block.get("BlockType") == "LINE":
            text = block.get("Text", "").strip()
            if text:
                lines.append(text)

    return lines


def find_total_amount(lines):
    amount_pattern = re.compile(r'(?<!\d)(\d{1,3}(?:[,\s]\d{3})*|\d+)(?:\.\d{2})?(?!\d)')
    total_keywords = ["total", "amount", "sum", "합계", "총액"]

    candidates = []

    for line in lines:
        lowered = line.lower()

        if any(keyword in lowered for keyword in total_keywords):
            matches = amount_pattern.findall(line)

            for match in matches:
                normalized = match.replace(",", "").replace(" ", "")
                try:
                    candidates.append(int(float(normalized)))
                except ValueError:
                    pass

    if candidates:
        return max(candidates)

    return None


def find_date(lines):
    date_patterns = [
        re.compile(r'(\d{4}[/-]\d{1,2}[/-]\d{1,2})'),
        re.compile(r'(\d{1,2}[/-]\d{1,2}[/-]\d{4})')
    ]

    for line in lines:
        for pattern in date_patterns:
            match = pattern.search(line)
            if match:
                return match.group(1)

    return None


def find_merchant_name(lines):
    if not lines:
        return None

    return lines[0]


def lambda_handler(event, context):
    try:
        body = json.loads(event.get("body") or "{}")
        bucket_name = body.get("bucket_name")
        s3_key = body.get("s3_key")

        if not bucket_name or not s3_key:
            return build_response(400, {
                "message": "bucket_name and s3_key are required"
            })

        textract_response = textract_client.detect_document_text(
            Document={
                "S3Object": {
                    "Bucket": bucket_name,
                    "Name": s3_key
                }
            }
        )

        lines = extract_lines(textract_response)
        merchant_name = find_merchant_name(lines)
        transaction_date = find_date(lines)
        amount = find_total_amount(lines)

        result = {
            "merchant_name": merchant_name,
            "transaction_date": transaction_date,
            "amount": amount,
            "raw_lines": lines[:30]
        }

        return build_response(200, result)

    except Exception as e:
        return build_response(500, {
            "message": "Failed to process OCR",
            "error": str(e)
        })