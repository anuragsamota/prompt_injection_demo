from stable_baselines3 import PPO
from joblib import load
import numpy as np

model = PPO.load("artifacts/prompt_defense_ppo")
vectorizer = load("artifacts/tfidf_vectorizer.joblib")

def check_prompt(prompt):
    vec = vectorizer.transform([prompt]).toarray().astype(np.float32)
    action, _ = model.predict(vec)

    # Force convert to scalar safely
    try:
        return int(action.item())
    except:
        return int(np.asarray(action).reshape(-1)[0])