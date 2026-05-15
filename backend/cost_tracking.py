import os
import logging
import time
from collections import defaultdict
from fastapi import FastAPI, Request, HTTPException, logger
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from datetime import datetime
from monitoring import Metrics

app = FastAPI()

metrics = Metrics()

class CostTracker:
    PRICES = {
        'gpt-3.5-turbo': {
            'input': 0.0005 / 1000,   # per token
            'output': 0.0015 / 1000
        },
        'gpt-4': {
            'input': 0.03 / 1000,
            'output': 0.06 / 1000
        }
    }

    def __init__(self):
        self.costs = defaultdict(float)
        self.token_usage = defaultdict(int)

    def track_usage(self, model: str, input_tokens:int, output_tokens: int):
        if model not in self.PRICES:
            model = 'gpt-3.5-turbo'  # default 
        
        input_cost = input_tokens * self.PRICES[model]['input']
        output_cost = output_tokens * self.PRICES[model]['output']
        total_cost = input_cost + output_cost

        self.costs[model] += total_cost
        self.token_usage[f'{model}_input'] += input_tokens
        self.token_usage[f'{model}_output'] += output_tokens

        logger.info(f"AI Cost: ${total_cost:.6f} ({input_tokens} in  + {output_tokens} out)")

        return total_cost

    def get_total_cost(self):

        return sum(self.costs.values())
    
    def get_report(self):
        return {
            'total_cost': round(self.get_total_cost(), 2),
            'costs_by_model': {k: round(v, 2) for k, v in self.costs.items()},
            'token_usage': dict(self.token_usage)
        }

cost_tracker = CostTracker()




@app.get('/api/costs')
async def get_cost():
    return cost_tracker.get_report()


class Alerting:

    def __init__(self):
        self.thresholds = {
            'error_rate': 0.05,
            'response_time': 5.0,
            'cost_per_hour': 10.0
        }
        self.alerts = []

    def check_metrics(self, metrics_data: dict):
        total_requests = metrics_data['total_requests']
        total_errors = metrics_data['total_errors']

        if total_requests > 0:
            error_rate = total_errors / total_requests

            if error_rate > self.thresholds['error_rate']:
                alert = f"High error rate: {error_rate:.1%}"
                self.alerts.append(alert)
                logger.warning(alert)
        
        avg_time = metrics_data['avg_response_time']

        if avg_time > self.thresholds['response_time']:
            alert =f"Slow responses: {avg_time:.2f}s avg"
            self.alerts.append(alert)
            logger.warning(alert)

    def get_alerts(self):
        return self.alerts[-10:]

alerting = Alerting()


@app.get('/api/dashboard')
async def dashboard():
    metrics_data = metrics.get_stats()
    cost_data = cost_tracker.get_report()

    alerting.check_metrics(metrics_data)

    return {
        'metrics': metrics_data,
        'costs': cost_data,
        'alert': alerting.get_alerts(),
        'timestamp': datetime.now().isoformat()
    }


if __name__ == '__main__':
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)