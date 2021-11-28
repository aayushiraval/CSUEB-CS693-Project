#!/usr/bin/env bash

# Update Helm repositories.
helm repo add bitnami https://charts.bitnami.com/bitnami
helm repo update

# ! See backend/README for instructions on pulling these secret
# ! and configmap files from our Vault.
kubectl apply -f ./credentials.local.json

# Update Helm releases.
helm upgrade -i elearning-mongo bitnami/mongodb --values ./helm_mongo_values.yaml  --version=8.0.0
