#!/bin/bash

if [ $# -ne 5 ]
then
    echo "**********************************************************************"
    echo "Indigo"
    echo "This program comes with ABSOLUTELY NO WARRANTY."
    echo ""
    echo "Indigo (Version: 0.1.1)"
    echo "Contact: Tobias Rausch (rausch@embl.de)"
    echo "**********************************************************************"
    echo ""
    echo "Usage: $0 <experiment.ab1> <genome.fa.gz> <ltrim> <rtrim> <output prefix>"
    echo ""
    exit -1
fi

SCRIPT=$(readlink -f "$0")
BASEDIR=$(dirname "$SCRIPT")

# Terminate on error
set -e

# Create Align Output
tracy decompose -f both -g ${2} -l ${3} -r ${4} -o ${5} ${1}  

# Plot results
Rscript ${BASEDIR}/R/indigo.R ${5}
