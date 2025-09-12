from flask import Flask, render_template, jsonify, request
import random

app = Flask(__name__, static_folder="static", template_folder="templates")

# Small curated word list (suitable for TBI users: simple, concrete words)
WORDS = [
    "apple", "table", "book", "chair", "dog", "car", "tree", "cup", "shoe",
    "pen", "lamp", "door", "phone", "hat", "flower", "ball", "cat", "plate",
    "clock", "key"
]

# Picture set using emoji + alt text (keeps assets simple & high-contrast)
PICTURES = [
    {"id": "dog", "label": "Dog", "emoji": "🐶"},
    {"id": "apple", "label": "Apple", "emoji": "🍎"},
    {"id": "car", "label": "Car", "emoji": "🚗"},
    {"id": "tree", "label": "Tree", "emoji": "🌳"},
    {"id": "book", "label": "Book", "emoji": "📘"},
    {"id": "cup", "label": "Cup", "emoji": "☕"},
    {"id": "ball", "label": "Ball", "emoji": "⚽"},
    {"id": "flower", "label": "Flower", "emoji": "🌼"}
]

@app.route('/', methods=['GET', 'POST'])
def home():
    word = None
    if request.method == 'POST':
        word = request.form.get('wordInput')
    return render_template('index.html', word=word)

@app.route("/quick-recall")
def quick_recall_page():
    return render_template("quick_recall.html")

@app.route("/picture-match")
def picture_match_page():
    return render_template("picture_match.html")

# API endpoint to get a random word sequence
@app.route("/api/words")
def api_words():
    try:
        n = int(request.args.get("n", 3))
    except ValueError:
        n = 3
    n = max(2, min(n, 8))  # clamp between 2 and 8
    sequence = random.sample(WORDS, n)
    return jsonify({"sequence": sequence})

# API endpoint to get a random picture set
@app.route("/api/pictures")
def api_pictures():
    try:
        n = int(request.args.get("n", 4))
    except ValueError:
        n = 4
    n = max(2, min(n, len(PICTURES)))
    choices = random.sample(PICTURES, n)
    # return minimal info for client to render
    return jsonify({"pictures": choices})

if __name__ == "__main__":
    app.run(debug=True)
