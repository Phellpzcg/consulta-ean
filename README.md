# Consulta GTIN via SEFAZ (SVRS)

Backend Node.js + TypeScript para consulta de GTIN no Cadastro Centralizado de GTIN (CCG) da GS1, via Web Service da SEFAZ (SVRS), conforme NT 2022.001 e Guia Consulta GTIN [31-05-22].

## Funcionalidades

- SOAP 1.2 com TLS 1.2 e autenticação mútua (ICP-Brasil)
- Normalização e validação de GTIN (8/12/13/14)
- Validação de prefixo GS1 (789/790)
- Tratamento de códigos de retorno 9490–9498 e erros de infraestrutura
- Parse estruturado do XML de retorno
- Endpoint REST: `POST /api/gtin/consultar`

## Estrutura de Pastas

```
src/
  api/gtinController.ts
  config/env.ts
  gtin/validation.ts
  soap/
    certificate.ts
    signature.ts
    soapClient.ts
    soapEnvelope.ts
  utils/logger.ts
  index.ts
```

## Pré-requisitos

- Node.js 18+
- Certificado ICP-Brasil (A1 ou A3 convertido)

## Configuração do Certificado

Use **uma** das opções abaixo:

### 1) Certificado A1 via arquivo `.pfx`

```
CERT_PFX_PATH=/caminho/certificado.pfx
CERT_PASSPHRASE=senha
```

### 2) Certificado A1 em Base64

```
CERT_PFX_BASE64=BASE64_DO_PFX
CERT_PASSPHRASE=senha
```

### 3) Certificado instalado/repositório via PEM

```
CERT_PEM_PATH=/caminho/cert.pem
CERT_KEY_PATH=/caminho/key.pem
CERT_PASSPHRASE=senha
```

> **Observação:** para A3, é necessário usar o driver/utility do fornecedor para exportar para PFX/PEM.

### Validação do CNPJ/CPF do certificado (opcional)

Defina o CNPJ/CPF esperado:

```
CERT_HOLDER_ID=12345678000123
```

## Variáveis de Ambiente

| Variável | Descrição | Padrão |
| --- | --- | --- |
| `PORT` | Porta HTTP | `3000` |
| `SEFAZ_GTIN_URL` | URL SVRS produção | URL oficial |
| `SEFAZ_TIMEOUT_MS` | Timeout da requisição | `15000` |
| `SEFAZ_GZIP` | Usa gzip | `false` |
| `SEFAZ_SIGN_XML` | Assina o XML (`consGTIN`) | `false` |
| `REQUIRE_CERT` | Exige certificado | `true` |
| `LOG_LEVEL` | `debug`/`info`/`warn`/`error` | `info` |

## Instalação

```
npm install
npm run dev
```

## Exemplo de chamada

```
curl -X POST http://localhost:3000/api/gtin/consultar \
  -H 'Content-Type: application/json' \
  -d '{"gtin":"7891234567895"}'
```

## Exemplo de resposta

```
{
  "status": "sucesso",
  "codigo": "9490",
  "mensagem": "Consulta realizada com sucesso",
  "produto": {
    "gtin": "07891234567895",
    "descricao": "Produto Exemplo",
    "ncm": "21069090",
    "tpGTIN": "EAN13",
    "cest": ["0302700"]
  }
}
```

## Observações legais e fiscais

- A consulta ao CCG da GS1 deve respeitar a autorização do dono da marca.
- O uso do serviço é restrito a emitentes autorizados de NF-e/NFC-e.
- Consulte as Notas Técnicas e guias oficiais para regras de atualização.
- Não registre dados sensíveis do certificado em logs ou arquivos.

## Checklist de requisitos atendidos

- SOAP 1.2 sem SOAP Header
- TLS 1.2 com autenticação mútua
- XML UTF-8 com namespace padrão da NF-e
- Processo síncrono
- Tratamento de GTIN inválido, inexistente, sem autorização e erros infra
- Compactação GZIP opcional
- Endpoint REST com JSON estruturado
