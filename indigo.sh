#!/bin/bash

if [ $# -ne 6 ]
then
    echo "**********************************************************************"
    echo "Indigo: This program comes with ABSOLUTELY NO WARRANTY."
    echo "Version: 0.1.2"
    echo "**********************************************************************"
    echo ""
    echo "Usage: $0 <experiment.ab1> <genome.fa.gz> <ltrim> <rtrim> <pratio> <output prefix>"
    echo ""
    exit -1
fi

SCRIPT=$(readlink -f "$0")
BASEDIR=$(dirname "$SCRIPT")

# Terminate on error
set -e

# Create Align Output
if [[ $2 == *.fa.gz ]]
then
    tracy decompose -v -a ${2} -r ${2} -q ${3} -u ${4} -p ${5} -o ${6} ${1}
else
    tracy decompose -v -r ${2} -q ${3} -u ${4} -p ${5} -o ${6} ${1}
fi

# Plot results
Rscript ${BASEDIR}/R/indigo.R ${6}
