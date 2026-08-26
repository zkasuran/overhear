> ## Documentation Index
> Fetch the complete documentation index at: https://docs.gmicloud.ai/llms.txt
> Use this file to discover all available pages before exploring further.

# MiniMax M2.7

> MiniMax-M2.7 is MiniMax's first model deeply participating in its own evolution.

**Model ID**

```bash theme={null}
MiniMaxAI/MiniMax-M2.7
```

## API Usage

MiniMax-M2.7 supports two API formats:

* **OpenAI-compatible**: `/v1/chat/completions` endpoint
* **Anthropic-compatible**: `/v1/messages` endpoint (with extended thinking support)

## API Examples

### OpenAI-Compatible Endpoint

Generate a model response using the chat completions endpoint.

#### Shell

```bash theme={null}
curl --request POST \
  --url https://api.gmi-serving.com/v1/chat/completions \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer *************' \
  --data '{
    "model": "MiniMaxAI/MiniMax-M2.7",
    "messages": [
      {"role": "system", "content": "You are a helpful AI assistant with strong reasoning and coding ability."},
      {"role": "user", "content": "Explain how the Mixture-of-Experts architecture improves inference efficiency in large language models."}
    ],
    "max_tokens": 1024
  }'
```

#### Python

```python theme={null}
import requests
import json

url = "https://api.gmi-serving.com/v1/chat/completions"
headers = {
    "Content-Type": "application/json",
    "Authorization": "Bearer YOUR_API_KEY"
}

payload = {
    "model": "MiniMaxAI/MiniMax-M2.7",
    "messages": [
        {"role": "system", "content": "You are a capable AI coding assistant"},
        {"role": "user", "content": "Refactor this multi-file Python module to make it async-ready"}
    ],
    "max_tokens": 1024
}

response = requests.post(url, headers=headers, json=payload)
print(json.dumps(response.json(), indent=2))
```

### Anthropic-Compatible Endpoint (with Extended Thinking)

The `/v1/messages` endpoint provides access to the model's reasoning process through the "thinking" content block. You can also use the Anthropic SDK directly by configuring the base URL.

#### Using Anthropic SDK (Recommended)

```text theme={null}
# Configure environment variables
export ANTHROPIC_BASE_URL=https://api.minimax.io/anthropic
export ANTHROPIC_API_KEY=${YOUR_API_KEY}
```

```python theme={null}
import anthropic

client = anthropic.Anthropic()

message = client.messages.create(
    model="MiniMax-M2.7",
    max_tokens=1000,
    system="You are a helpful assistant.",
    messages=[
        {
            "role": "user",
            "content": [
                {
                    "type": "text",
                    "text": "Hi, how are you?"
                }
            ]
        }
    ]
)

for block in message.content:
    if block.type == "thinking":
        print(f"Thinking:\n{block.thinking}\n")
    elif block.type == "text":
        print(f"Text:\n{block.text}\n")
```

#### Shell (Direct API)

```bash theme={null}
curl --request POST \
  --url https://api.gmi-serving.com/v1/messages \
  -H 'Content-Type: application/json' \
  -H 'x-api-key: *************' \
  --data '{
    "model": "MiniMaxAI/MiniMax-M2.7",
    "max_tokens": 1024,
    "messages": [
      {"role": "user", "content": "Solve this step by step: What is 23 * 47?"}
    ]
  }'
```

#### Shell (with Streaming)

```bash theme={null}
curl --request POST \
  --url https://api.gmi-serving.com/v1/messages \
  -H 'Content-Type: application/json' \
  -H 'x-api-key: *************' \
  --data '{
    "model": "MiniMaxAI/MiniMax-M2.7",
    "max_tokens": 1024,
    "messages": [
      {"role": "user", "content": "Tell me a three sentence bedtime story about a unicorn."}
    ],
    "stream": true
  }'
```

#### Python (with Streaming)

```python theme={null}
import anthropic

client = anthropic.Anthropic()

stream = client.messages.create(
    model="MiniMax-M2.7",
    max_tokens=1000,
    system="You are a helpful assistant.",
    messages=[
        {"role": "user", "content": [{"type": "text", "text": "Hi, how are you?"}]}
    ],
    stream=True,
)

for chunk in stream:
    if chunk.type == "content_block_delta":
        if hasattr(chunk, "delta") and chunk.delta:
            if chunk.delta.type == "thinking_delta":
                print(chunk.delta.thinking, end="", flush=True)
            elif chunk.delta.type == "text_delta":
                print(chunk.delta.text, end="", flush=True)
```
