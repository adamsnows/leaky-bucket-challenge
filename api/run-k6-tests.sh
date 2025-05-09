#!/bin/bash
# filepath: /Users/adamsnows/Projects/github-projects/leaky-bucket/api/run-k6-tests.sh

# Cores para o terminal
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Iniciando testes de carga do Leaky Bucket ===${NC}"

# Verifica se k6 está instalado
if ! command -v k6 &> /dev/null; then
  echo -e "${RED}ERRO: k6 não está instalado. ${NC}"
  echo -e "${YELLOW}Deseja instalar o k6 agora? (y/n)${NC}"
  read -p "" install_choice
  if [[ "$install_choice" =~ ^[Yy]$ ]]; then
    # Detecta o sistema operacional e instala o k6
    if [[ "$OSTYPE" == "darwin"* ]]; then
      echo -e "${GREEN}Instalando k6 via Homebrew...${NC}"
      brew install k6
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
      echo -e "${GREEN}Instalando k6 via apt/snap...${NC}"
      if command -v apt &> /dev/null; then
        sudo apt-get update
        sudo apt-get install -y k6
      elif command -v snap &> /dev/null; then
        sudo snap install k6
      else
        echo -e "${RED}Não foi possível detectar o gerenciador de pacotes. Por favor, instale manualmente:${NC}"
        echo -e "Instruções: https://k6.io/docs/get-started/installation/"
        exit 1
      fi
    else
      echo -e "${RED}Sistema operacional não suportado para instalação automática.${NC}"
      echo -e "Instruções de instalação manual: https://k6.io/docs/get-started/installation/"
      exit 1
    fi

    # Verifica se a instalação foi bem sucedida
    if ! command -v k6 &> /dev/null; then
      echo -e "${RED}Falha na instalação do k6. Por favor, instale manualmente seguindo as instruções:${NC}"
      echo -e "https://k6.io/docs/get-started/installation/"
      exit 1
    else
      echo -e "${GREEN}k6 instalado com sucesso!${NC}"
    fi
  else
    echo -e "${YELLOW}Por favor, instale o k6 manualmente seguindo as instruções:${NC}"
    echo -e "https://k6.io/docs/get-started/installation/"
    exit 1
  fi
fi

# Verifica se o servidor está rodando
echo -e "${YELLOW}Verificando se o servidor está rodando na porta 4000...${NC}"
if ! nc -z localhost 4000 &>/dev/null; then
  echo -e "${YELLOW}Servidor não encontrado. Iniciando o servidor para os testes...${NC}"

  # Inicia o servidor
  echo -e "${GREEN}Iniciando servidor na porta 4000...${NC}"
  NODE_ENV=test npm run dev > /tmp/server.log 2>&1 &
  SERVER_PID=$!

  # Função para limpar o servidor após o fim do script
  cleanup() {
    echo -e "${YELLOW}Encerrando servidor (PID: $SERVER_PID)...${NC}"
    kill $SERVER_PID 2>/dev/null || true
    wait $SERVER_PID 2>/dev/null || true
    echo -e "${GREEN}Servidor encerrado.${NC}"
    exit
  }

  # Registra função de limpeza para ser chamada no fim do script
  trap cleanup EXIT INT TERM

  # Aguarda o servidor iniciar
  echo -e "${YELLOW}Aguardando servidor inicializar (até 30 segundos)...${NC}"
  for i in {1..30}; do
    if nc -z localhost 4000; then
      echo -e "${GREEN}Servidor está pronto!${NC}"
      # Dá um tempo para estabilizar
      sleep 5
      break
    fi

    # Se o servidor não estiver ativo após 30 segundos, encerra com erro
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

# Função para executar os testes k6 com tratamento de erros
run_test() {
  local test_file=$1
  local description=$2
  local timeout=${3:-"60s"}  # Timeout padrão de 60 segundos ou valor específico

  echo -e "\n${YELLOW}=======================================================${NC}"
  echo -e "${GREEN}Executando teste: ${description}${NC}"
  echo -e "${YELLOW}=======================================================${NC}\n"

  # Verifica se o arquivo de teste existe
  if [ ! -f "$test_file" ]; then
    echo -e "${RED}ERRO: Arquivo de teste '$test_file' não encontrado.${NC}"
    return 1
  fi

  # Implementa um mecanismo de timeout nativo para Bash
  # Converte o timeout em segundos para cálculos
  local timeout_seconds=0
  if [[ "$timeout" =~ ^([0-9]+)s$ ]]; then
    timeout_seconds=${BASH_REMATCH[1]}
  elif [[ "$timeout" =~ ^([0-9]+)m$ ]]; then
    timeout_seconds=$((${BASH_REMATCH[1]} * 60))
  fi

  echo -e "${YELLOW}Executando teste com limite de ${timeout}...${NC}"

  # Cria um arquivo temporário para comunicação entre processos
  local tmp_file=$(mktemp)

  # Executa o k6 em background
  k6 run "$test_file" > "$tmp_file" 2>&1 &
  local k6_pid=$!

  # Monitora o processo por um período de tempo
  local elapsed=0
  while kill -0 $k6_pid 2>/dev/null; do
    if [ "$timeout_seconds" -gt 0 ] && [ $elapsed -ge "$timeout_seconds" ]; then
      echo -e "${RED}ERRO: Teste excedeu o tempo limite de $timeout.${NC}"
      kill -9 $k6_pid 2>/dev/null || true
      cat "$tmp_file"
      rm -f "$tmp_file"
      return 1
    fi
    sleep 1
    ((elapsed++))
  done

  # Captura o código de saída
  wait $k6_pid
  local result=$?

  # Mostra a saída do k6
  cat "$tmp_file"
  rm -f "$tmp_file"

  if [ $result -ne 0 ]; then
    echo -e "${RED}ERRO: Teste falhou com código de saída $result.${NC}"
    return $result
  elif [ $result -ne 0 ]; then
    echo -e "${RED}ERRO: Teste falhou com código de saída $result.${NC}"
    return $result
  else
    echo -e "\n${GREEN}Teste concluído com sucesso: ${description}${NC}\n"
    return 0
  fi
}

# Primeiro teste é a verificação de conectividade
run_test "src/tests/k6-connectivity-check.js" "Verificação de conectividade com o servidor" "30s"
connectivity_result=$?

# Se o teste de conectividade for bem-sucedido, prossegue com outros testes
if [ $connectivity_result -eq 0 ]; then
  echo -e "${GREEN}Teste de conectividade bem-sucedido! Prosseguindo com outros testes...${NC}"

  # Teste de carga básico com timeout maior
  run_test "src/tests/k6-multi-user-test-timeout.js" "Teste com múltiplos usuários (timeout aumentado)" "2m"

  # Perguntar se deseja continuar com testes mais intensivos
  read -p "Deseja continuar com os testes mais intensivos? Estes testes podem levar mais tempo (y/n): " continue_choice
  if [[ "$continue_choice" =~ ^[Yy]$ ]]; then
    # Teste de pico de carga
    run_test "src/tests/k6-leaky-bucket-improved.js" "Teste de pico de carga (spike test)" "2m"

    # Verifica se existe o arquivo de teste de status de token
    if [ -f "src/tests/k6-token-status-test.js" ]; then
      # Teste de status de token
      run_test "src/tests/k6-token-status-test.js" "Teste do endpoint de status de token" "1m"
    fi

    # Teste com múltiplos usuários (versão original)
    run_test "src/tests/k6-multi-user-test.js" "Teste com múltiplos usuários (IPs diferentes)" "2m"

    # Teste de recarga de tokens (o mais longo)
    read -p "Deseja executar o teste de recarga de tokens? Este teste leva vários minutos (y/n): " refill_choice
    if [[ "$refill_choice" =~ ^[Yy]$ ]]; then
      run_test "src/tests/k6-token-refill-test.js" "Teste de recarga automática de tokens" "10m"
    fi
  fi
else
  echo -e "${RED}O teste de conectividade falhou. Verificando problemas no servidor...${NC}"
  # Mostra as últimas linhas do log do servidor
  if [ -n "$SERVER_PID" ] && [ -f "/tmp/server.log" ]; then
    echo -e "${YELLOW}Últimas linhas do log do servidor:${NC}"
    tail -n 20 /tmp/server.log
  fi
  exit 1
fi

echo -e "\n${BLUE}=== Todos os testes concluídos ===${NC}"

# Se iniciamos o servidor para os testes, mostra onde encontrar os logs
if [ -n "$SERVER_PID" ]; then
  echo -e "${YELLOW}O servidor de testes será encerrado automaticamente.${NC}"
  echo -e "${YELLOW}Os logs do servidor estão disponíveis em: /tmp/server.log${NC}"
fi
