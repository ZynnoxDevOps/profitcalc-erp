---
description: Puxar do GitHub antes de qualquer mudança no projeto
---

# Fluxo Obrigatório - Antes de Qualquer Mudança

**IMPORTANTE:** Este fluxo DEVE ser executado antes de qualquer edição de código no projeto ProfitCalc ERP.
O banco de dados (`database.db`) está no `.gitignore` e não vai para o GitHub, então ele é preservado localmente.
Porém, é necessário sempre ter o código mais recente antes de editar.

## Passos

// turbo
1. Puxar a versão mais recente do GitHub:
```
git pull origin main
```

2. Verificar se há conflitos na saída. Se aparecer `Already up to date.`, pode prosseguir. Se houver conflitos, resolva antes de editar.

3. Somente após o pull bem-sucedido, fazer as alterações no código.

4. Após as alterações, commitar e enviar para o GitHub:
```
git add -A
git commit -m "descrição da mudança"
git remote set-url origin https://TOKEN@github.com/ZynnoxDevOps/profitcalc-erp.git
git push origin main
git remote set-url origin https://github.com/ZynnoxDevOps/profitcalc-erp.git
```

> O token de acesso (`ghp_...`) deve ser usado apenas no momento do push e removido em seguida da URL.
