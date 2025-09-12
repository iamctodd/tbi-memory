from flask import Flask, render_template, request, session, jsonify
import random

app = Flask(__name__)
app.secret_key = 'your-secret-key-here'  # Change this to a random string

# Word pool for the memory game
WORD_POOL = ['cat', 'dog', 'tree', 'house', 'car', 'book', 'sun', 'moon', 'star', 'fish', 
             'bird', 'flower', 'water', 'fire', 'rock', 'wind', 'cloud', 'rain', 'snow', 'leaf']

@app.route('/')
def index():
    # Initialize session variables if they don't exist
    if 'level' not in session:
        session['level'] = 1
        session['score'] = 0
        session['lives'] = 3
        session['sequence'] = []
        session['game_state'] = 'start'
    
    return render_template('index.html', 
                         level=session.get('level', 1),
                         score=session.get('score', 0),
                         lives=session.get('lives', 3),
                         game_state=session.get('game_state', 'start'),
                         sequence=session.get('sequence', []))

@app.route('/start_game', methods=['POST'])
def start_game():
    # Generate new sequence
    sequence_length = session.get('level', 1) + 1
    sequence = [random.choice(WORD_POOL) for _ in range(sequence_length)]
    
    session['sequence'] = sequence
    session['game_state'] = 'showing'
    
    return jsonify({'sequence': sequence})

@app.route('/submit_sequence', methods=['POST'])
def submit_sequence():
    user_sequence = request.json.get('sequence', [])
    correct_sequence = session.get('sequence', [])
    
    # Convert to lowercase for comparison
    user_sequence = [word.lower().strip() for word in user_sequence]
    correct_sequence = [word.lower() for word in correct_sequence]
    
    if user_sequence == correct_sequence:
        # Correct answer
        session['score'] = session.get('score', 0) + session.get('level', 1) * 10
        session['level'] = session.get('level', 1) + 1
        session['game_state'] = 'correct'
        return jsonify({'correct': True, 'message': 'Correct! Well done!', 
                       'score': session['score'], 'level': session['level']})
    else:
        # Wrong answer
        session['lives'] = session.get('lives', 3) - 1
        if session['lives'] > 0:
            session['game_state'] = 'wrong'
            return jsonify({'correct': False, 'message': f'Wrong sequence! {session["lives"]} lives remaining.',
                           'lives': session['lives'], 'game_over': False})
        else:
            session['game_state'] = 'game_over'
            final_score = session.get('score', 0)
            final_level = session.get('level', 1)
            return jsonify({'correct': False, 'message': 'Game Over!', 
                           'game_over': True, 'final_score': final_score, 'final_level': final_level})

@app.route('/reset_game', methods=['POST'])
def reset_game():
    session['level'] = 1
    session['score'] = 0
    session['lives'] = 3
    session['sequence'] = []
    session['game_state'] = 'start'
    return jsonify({'reset': True})

if __name__ == '__main__':
    app.run(debug=True)