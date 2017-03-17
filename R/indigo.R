library(sangerseqR)
library(gplots)
library(ggplot2)

args=commandArgs(trailingOnly=TRUE)
experiment = args[1]
outpdf = args[2]

pdf(outpdf)


# Get trim sizes
r = read.table(paste0(outpdf, ".abif"), header=T)
ltrim = (1:nrow(r))[r$trim=='N'][1] - 1
rtrim = nrow(r) - tail((1:nrow(r))[r$trim=='N'], n=1)
lentr = nrow(r) - ltrim - rtrim
print(list(left=ltrim, right=rtrim, tracelength=lentr))

# Plot chromatogram
sanger = readsangerseq(experiment)
bc = makeBaseCalls(sanger, ratio = 0.33)
chromatogram(bc, width = 80, height = 2, trim5 = ltrim, trim3 = rtrim, showcalls = "both")

# Print decomposition
dc = read.table(paste0(outpdf, ".decomp"), header=T)
ggplot(data=dc, aes(x=indel, y=decomp)) + geom_line() + geom_point() + xlab("InDel length (in bp)") + ylab("Decomposition Error") + ylim(0,max(dc$decomp))

# Plot alignments
filename=paste0(outpdf, ".align1")
textplot(readChar(filename, file.info(filename)$size))
filename=paste0(outpdf, ".align2")
textplot(readChar(filename, file.info(filename)$size))

dev.off()

