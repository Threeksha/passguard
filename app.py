"""
PassGuard — Password Security Analyzer (Flask backend)
-------------------------------------------------------
Serves the front-end and exposes one API route, /api/explain, which asks
Groq's free AI to explain WHY a password is weak or strong.

Privacy note: the raw password is never sent to this backend or to the AI.
Only a small summary of computed features (score, checks passed, detected
patterns) is sent — enough for the AI to write a useful explanation without
ever seeing the actual password.
"""

import os
import json
from flask import Flask, render_template, request, jsonify
from groq import Groq

app = Flask(__name__)

client = Groq()  # reads GROQ_API_KEY from your environment


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/api/explain", methods=["POST"])
def explain():
    data = request.get_json(force=True)

    score = data.get("score", 0)
    status = data.get("status", "unknown")
    entropy = data.get("entropy", 0)
    passed_checks = data.get("passedChecks", [])
    failed_checks = data.get("failedChecks", [])
    patterns = data.get("patternsFound", [])

    prompt = f"""A password scored {score}/100 ({status}), with an estimated
entropy of {entropy} bits.

Checks it PASSED: {", ".join(passed_checks) if passed_checks else "none"}
Checks it FAILED: {", ".join(failed_checks) if failed_checks else "none"}
Patterns detected: {", ".join(patterns) if patterns else "none"}

In 2-3 short sentences, explain to a beginner why this password is
{status.lower()}, referencing the specific checks and patterns above.
Be direct and practical, not generic. Do not invent details not given above.
Do not guess or restate the actual password."""

    try:
        response = client.chat.completions.create(
            model="openai/gpt-oss-120b",
            messages=[{"role": "user", "content": prompt}],
        )
        explanation = response.choices[0].message.content.strip()
        return jsonify({"explanation": explanation})
    except Exception as e:
        return jsonify({"explanation": None, "error": str(e)}), 500


if __name__ == "__main__":
    app.run(debug=True)
