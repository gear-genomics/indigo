<p align="center">
  <img height="150" src="https://raw.githubusercontent.com/tobiasrausch/indigo/master/indigo.png">
  <h1 align="center">Indigo</h1>
</p>

Indigo is a rapid method to separate a mutated and wildtype allele in Sanger Chromatogram data. Indigo finds the Chromatogram consensus sequence in the reference, threads the reference allele through the Chromatogram peaks and re-aligns the mutated allele against the reference genome. Indigo discovers mutations generated by genome editing tools such as CRISPR/Cas9 or TALENs.

Installing Indigo
-----------------

`git clone --recursive https://github.com/tobiasrausch/indigo.git`

`cd indigo/`

`make all`

Running Indigo
--------------

`./src/indigo -g Danio_rerio.GRCz10.dna.toplevel.fa.gz del7.ab1`
