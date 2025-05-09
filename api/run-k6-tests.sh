#!/bin/bash
# filepath: /Users/adamsnows/Projects/github-projects/leaky-bucket/api/run-k6-tests.sh

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}=== Iniciando testes de carga do Leaky Bucket ===${NC}"

echo -e "${YELLOW}Verificando se o servidor está rodando na porta 4000...${NC}"
if ! nc -z localhost 4000 &>/dev/null; then
  echo -e "${YELLOW}Servidor não encontrado. Iniciando o servidor para os testes...${NC}"

  # start server
  echo -e "${GREEN}Iniciando servidor na porta 4000...${NC}"
  NODE_ENV=test npm run dev > /tmp/server.log 2>&1 &
  SERVER_PID=$!

  # cleaning server after script ends
  cleanup() {
    echo -e "${YELLOW}Encerrando servidor (PID: $SERVER_PID)...${NC}"
    kill $SERVER_PID 2>/dev/null || true
    wait $SERVER_PID 2>/dev/null || true
    echo -e "${GREEN}Servidor encerrado.${NC}"
    exit
  }

  # register cleanup function to be called on script exit
  trap cleanup EXIT INT TERM

  # await for the server to start
  echo -e "${YELLOW}Aguardando servidor inicializar (até 30 segundos)...${NC}"
  for i in {1..30}; do
    if nc -z localhost 4000; then
      echo -e "${GREEN}Servidor está pronto!${NC}"
      # give it a moment to stabilize
      sleep 2
      break
    fi

    # if the server is not up after 30 seconds, exit with error
    if [ $i -eq 30 ]; then
      echo -e "${RED}ERRO: Servidor não iniciou em tempo hábil. Verifique os logs em /tmp/server.log${NC}"
      exit 1
    fi

    echo -n "."
    sleep 1
  done
  echo ""
else
  echo -e "${GREEN}Servidor já está rodando na porta 4000.${NC}"
fi

# function to run k6 tests
run_test() {
  local test_file=$1
  local description=$2

  echo -e "\n${YELLOW}=======================================================${NC}"
  echo -e "${GREEN}Executando teste: ${description}${NC}"
  echo -e "${YELLOW}=======================================================${NC}\n"

  k6 run "$test_file"

  echo -e "\n${GREEN}Teste concluído: ${description}${NC}\n"
}

# first test is connectivity check
run_test "src/tests/k6-connectivity-check.js" "Verificação de conectividade com o servidor"

# if the connectivity test is successful, proceed with other tests
if [ $? -eq 0 ]; then
  # load basic test
  run_test "src/tests/k6-leaky-bucket-improved.js" "Teste de pico de carga (spike test)"

# user token test
run_test "src/tests/k6-token-status-test.js" "Teste do endpoint de status de token"

# multiple user test
run_test "src/tests/k6-multi-user-test.js" "Teste com múltiplos usuários (IPs diferentes)"

# token recharge test
read -p "Deseja executar o teste de recarga de tokens? Este teste leva vários minutos (y/n): " choice
if [[ "$choice" =~ ^[Yy]$ ]]; then
  run_test "src/tests/k6-token-refill-test.js" "Teste de recarga automática de tokens"
fi
else
  echo -e "${RED}O teste de conectividade falhou. Verificando problemas no servidor...${NC}"
  # show last lines of the server log
  if [ -n "$SERVER_PID" ] && [ -f "/tmp/server.log" ]; then
    echo -e "${YELLOW}Últimas linhas do log do servidor:${NC}"
    tail -n 20 /tmp/server.log
  fi
  exit 1
fi

echo -e "\n${BLUE}=== Todos os testes concluídos ===${NC}"

# if the server was started by this script
if [ -n "$SERVER_PID" ]; then
  echo -e "${YELLOW}O servidor de testes será encerrado automaticamente.${NC}"
  echo -e "${YELLOW}Os logs do servidor estão disponíveis em: /tmp/server.log${NC}"
fi
