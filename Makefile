CODESPELL       = $(shell which codespell)
SPELLCHECK      = $(CODESPELL) --skip="./node_modules,.git,./docs/.vitepress/*.*" -L applys,nd,accout,mattern,pres,fo
SPELLFIX      	= $(SPELLCHECK) -i 3 -w

.PHONY: spellcheck spellfix

spellcheck:
	$(if $(CODESPELL), $(SPELLCHECK), $(error "Aborting codecheck, command codespell not found in PATH"))


spellfix:
	$(if $(CODESPELL), $(SPELLFIX), $(error "Aborting codecheck, command codespell not found in PATH"))
