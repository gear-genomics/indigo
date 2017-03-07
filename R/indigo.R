library(sangerseqR)
library(gplots)
library(ggplot2)

args=commandArgs(trailingOnly=TRUE)
experiment = args[1]
outpdf = args[2]

pdf(outpdf)

# Plot chromatogram
sanger = readsangerseq(experiment)
bc = makeBaseCalls(sanger, ratio = 0.33)
chromatogram(bc, width = 100, height = 2, trim5 = 50, trim3 = 50, showcalls = "both")

# Print decomposition
dc = read.table(paste0(outpdf, ".decomp"), header=T)
ggplot(data=dc, aes(x=indel, y=decomp)) + geom_line() + geom_point() + xlab("InDel length (in bp)") + ylab("Decomposition Error") + ylim(0,max(dc$decomp))

# Plot alignments
filename=paste0(outpdf, ".align1")
textplot(readChar(filename, file.info(filename)$size))
filename=paste0(outpdf, ".align2")
textplot(readChar(filename, file.info(filename)$size))

dev.off()

