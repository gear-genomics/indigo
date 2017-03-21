#!/bin/bash

if [ $# -ne 3 ]
then
    echo "**********************************************************************"
    echo "Indigo"
    echo "This program comes with ABSOLUTELY NO WARRANTY."
    echo ""
    echo "Indigo (Version: 0.0.2)"
    echo "Contact: Tobias Rausch (rausch@embl.de)"
    echo "**********************************************************************"
    echo ""
    echo "Usage: $0 <experiment.ab1> <genome.fa.gz> <output prefix>"
    echo ""
    exit -1
fi

SCRIPT=$(readlink -f "$0")
BASEDIR=$(dirname "$SCRIPT")

# Run analysis pipeline
${BASEDIR}/src/indigo -g ${2} -o ${3} ${1}  

# Plot results
Rscript ${BASEDIR}/R/indigo.R ${3}
