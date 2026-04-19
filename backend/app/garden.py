from flask import Flask, request, jsonify
from flask_cors import CORS
import boto3
import json

app = Flask(__name__)
CORS(app)

# Garden starts at 50 health, range is 0-100
garden_health = 50

def score_prompt(prompt):
    """Send prompt to Bedrock, get back a score from 1-10"""
    
    bedrock_runtime = boto3.client("bedrock-runtime", region_name="us-west-2")
    
    message = f"""Rate this AI prompt from 1 to 10.

    1 = very bad (vague, lazy, spammy, one word, no thought)
    10 = excellent (specific, thoughtful, learning-focused, well explained)

    Prompt: "{prompt}"

    Reply with ONLY a JSON object like this, nothing else:
    {{"score": 7, "reason": "Good question with context"}}"""

    response = bedrock_runtime.invoke_model(
        modelId="arn:aws:bedrock:us-west-2:759967343613:inference-profile/us.anthropic.claude-opus-4-6-v1",
        body=json.dumps({
            "anthropic_version": "bedrock-2023-05-31",
            "max_tokens": 32000,
            "messages": [{"role": "user", "content": message}]
        })
    )

    result = json.loads(response["body"].read())
    text = result["content"][0]["text"]
    return json.loads(text)  # {"score": 7, "reason": "..."}


def get_stage(health):
    """Convert health number to a garden stage name"""
    if health <= 0:  return "dead"
    if health < 20:  return "seed"
    if health < 40:  return "sprout"
    if health < 60:  return "sapling"
    if health < 80:  return "flower"
    return "thriving"


@app.route("/evaluate", methods=["POST"])
def evaluate():
    global garden_health

    prompt = request.json.get("prompt", "")
    if not prompt:
        return jsonify({"error": "no prompt provided"}), 400

    # Score the prompt
    result = score_prompt(prompt)
    score = result["score"]
    reason = result["reason"]

    # Update garden health based on score
    if score >= 7:
        garden_health += 10    # good prompt = grow
    elif score <= 3:
        garden_health -= 10    # bad prompt = decay
    # scores 4-6 do nothing

    # Keep health between 0 and 100
    garden_health = max(0, min(100, garden_health))

    return jsonify({
        "score": score,
        "reason": reason,
        "health": garden_health,
        "stage": get_stage(garden_health)
    })


@app.route("/garden", methods=["GET"])
def garden():
    return jsonify({
        "health": garden_health,
        "stage": get_stage(garden_health)
    })


if __name__ == "__main__":
    app.run(port=5000, debug=True)