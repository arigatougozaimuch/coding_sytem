import os
import json
from flask import Flask, render_template, jsonify, request

app = Flask(__name__)

LEADERBOARD_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'leaderboard.json')

def load_leaderboard():
    if not os.path.exists(LEADERBOARD_FILE):
        return []
    try:
        with open(LEADERBOARD_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception:
        return []

def save_leaderboard(data):
    try:
        with open(LEADERBOARD_FILE, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=4)
        return True
    except Exception:
        return False

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/scores', methods=['GET'])
def get_scores():
    scores = load_leaderboard()
    # Sort by difficulty, then by least moves, then by least time (seconds)
    # Return top 10 for each difficulty
    sorted_scores = sorted(scores, key=lambda x: (x.get('difficulty', 'easy'), x.get('moves', 999), x.get('time', 9999)))
    
    # Group by difficulty
    result = {
        'easy': [s for s in sorted_scores if s.get('difficulty') == 'easy'][:10],
        'medium': [s for s in sorted_scores if s.get('difficulty') == 'medium'][:10]
    }
    return jsonify(result)

@app.route('/api/scores', methods=['POST'])
def add_score():
    data = request.get_json()
    if not data or not all(k in data for k in ('username', 'difficulty', 'moves', 'time')):
        return jsonify({'error': 'Invalid request data'}), 400
        
    username = str(data['username']).strip()[:15] # limit to 15 chars
    difficulty = str(data['difficulty'])
    moves = int(data['moves'])
    time = int(data['time'])
    
    if not username:
        username = "Anonymous"
        
    scores = load_leaderboard()
    scores.append({
        'username': username,
        'difficulty': difficulty,
        'moves': moves,
        'time': time
    })
    
    if save_leaderboard(scores):
        return jsonify({'status': 'success', 'message': 'Score saved successfully'})
    else:
        return jsonify({'error': 'Failed to save score'}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
