#!/bin/bash

echo "=== PROBANDO ENDPOINT CON CURL ==="
echo ""
echo "URL: http://localhost:3000/api/project_management/5/stages"
echo ""

# Probar sin token
echo "1. Probando sin token:"
curl -s -w "\nStatus: %{http_code}\n" \
  -H "Content-Type: application/json" \
  "http://localhost:3000/api/project_management/5/stages"

echo ""
echo "----------------------------------------"
echo ""

# Probar con token dummy (para ver si es problema de auth)
echo "2. Probando con token dummy:"
curl -s -w "\nStatus: %{http_code}\n" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer dummy-token" \
  "http://localhost:3000/api/project_management/5/stages"

echo ""
echo "----------------------------------------"
echo ""

# Probar el endpoint de project-stages que funciona
echo "3. Probando endpoint project-stages (que debería funcionar):"
curl -s -w "\nStatus: %{http_code}\n" \
  -H "Content-Type: application/json" \
  "http://localhost:3000/api/project_management/5/project-stages"

echo ""
