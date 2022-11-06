import argparse
import json
import subprocess


my_parser = argparse.ArgumentParser()
my_parser.add_argument('--action', action='store', type=str, required=True)

args = my_parser.parse_args()

if args.action == 'bootstrap':
    existing_stacks = subprocess.run([
        'aws',
        'cloudformation',
        'describe-stacks',
    ], capture_output=True)
    if not (json.loads(existing_stacks.stdout)).get('Stacks'):
        subprocess.run([
            'cdk',
            'bootstrap',
        ])

if args.action == 'backend':
    subprocess.run([
        'cdk',
        'deploy',
        '--outputs-file',
        'frontend/cdk-outputs.json',
        '--require-approval',
        'never',
        '--hotswap',
        'AppStack',
    ])

if args.action == 'frontend':
    with open('frontend/cdk-outputs.json', 'r') as outfile:
        data = json.loads(outfile.read())
        websiteBucketName = data.get(
            'AppStack', {}).get('websiteBucketName')
        if websiteBucketName:
            subprocess.run([
                'aws',
                's3',
                'sync',
                './frontend',
                f's3://{websiteBucketName}',
            ])
