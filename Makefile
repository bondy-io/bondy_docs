CODESPELL       = $(shell which codespell)
SPELLCHECK      = $(CODESPELL) --skip="./node_modules,.git,./docs/.vitepress/*.*" -L applys,nd,accout,mattern,pres,fo
SPELLFIX      	= $(SPELLCHECK) -i 3 -w

.PHONY: spellfix

.PHONY: spellcheck
spellcheck:
	$(if $(CODESPELL), $(SPELLCHECK), $(error "Aborting codecheck, command codespell not found in PATH"))

.PHONY: spellfix
spellfix:
	$(if $(CODESPELL), $(SPELLFIX), $(error "Aborting codecheck, command codespell not found in PATH"))

.PHONY: dev
dev:
	yarn docs:dev