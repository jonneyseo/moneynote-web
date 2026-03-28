#!/bin/bash
# 사용법: ./deploy.sh <function-folder>
# 예시: ./deploy.sh save-receipt

set -e

FUNCTION_DIR=$1

if [ -z "$FUNCTION_DIR" ]; then
  echo "Usage: ./deploy.sh <function-folder>"
  echo "Available: create-upload-url, process-receipt-ocr, save-receipt"
  exit 1
fi

FUNCTION_MAP=(
  "create-upload-url:moneynote-create-upload-url-dev"
  "process-receipt-ocr:moneynote-process-receipt-ocr-dev"
  "save-receipt:moneynote-save-receipt-dev"
)

LAMBDA_NAME=""
for entry in "${FUNCTION_MAP[@]}"; do
  key="${entry%%:*}"
  val="${entry##*:}"
  if [ "$key" == "$FUNCTION_DIR" ]; then
    LAMBDA_NAME="$val"
    break
  fi
done

if [ -z "$LAMBDA_NAME" ]; then
  echo "Unknown function: $FUNCTION_DIR"
  exit 1
fi

cd "$(dirname "$0")/$FUNCTION_DIR"
zip -q function.zip lambda_function.py

aws lambda update-function-code \
  --function-name "$LAMBDA_NAME" \
  --zip-file fileb://function.zip \
  --output text --query 'FunctionName'

rm function.zip
echo "Deployed: $LAMBDA_NAME"
