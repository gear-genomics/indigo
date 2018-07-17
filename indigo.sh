#!/bin/bash

if [ $# -ne 3 ]
then
    echo "**********************************************************************"
    echo "Indigo"
    echo "This program comes with ABSOLUTELY NO WARRANTY."
    echo ""
    echo "Indigo (Version: 0.0.3)"
    echo "Contact: Tobias Rausch (rausch@embl.de)"
    echo "**********************************************************************"
    echo ""
    echo "Usage: $0 <experiment.ab1> <genome.fa.gz> <output prefix>"
    echo ""
    exit -1
fi

SCRIPT=$(readlink -f "$0")
BASEDIR=$(dirname "$SCRIPT")

# Create Align Output
tracy decompose -f both -g ${2} -o ${3} ${1}  

# Plot results
Rscript ${BASEDIR}/R/indigo.R ${3}
