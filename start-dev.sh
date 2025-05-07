#!/bin/bash

# Define cores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}Iniciando o ambiente de desenvolvimento do Leaky Bucket...${NC}"

# Verifica se o pnpm está instalado
if ! command -v pnpm &> /dev/null; then
    echo -e "${YELLOW}pnpm não encontrado. Instalando...${NC}"
    npm install -g pnpm
fi

# Instala as dependências do projeto
echo -e "${GREEN}Instalando dependências...${NC}"
pnpm install

# Inicia os serviços (API e frontend) em paralelo
echo -e "${GREEN}Iniciando API e frontend...${NC}"
pnpm dev