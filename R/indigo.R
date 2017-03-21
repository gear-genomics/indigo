library(gplots)
library(ggplot2)
library(reshape2)

args=commandArgs(trailingOnly=TRUE)
outpdf = args[1]

pdf(paste0(outpdf, ".pdf"))

# Trim trace
r = read.table(paste0(outpdf, ".abif"), header=T)
trim=r[!is.na(r$trim),c("pos","basenum", "trim")]
ntrim = trim[trim$trim=='N',]
ltrim = head(ntrim, n=1)$basenum - 1
rtrim = nrow(trim) - tail(ntrim, n=1)$basenum
lentr = nrow(trim) - ltrim - rtrim
print(list(left=ltrim, right=rtrim, tracelength=lentr))
r = r[head(ntrim, n=1)$pos:tail(ntrim, n=1)$pos,]

# Plot trace
scaleF = as.integer(lentr / 50)
if (scaleF < 5) { scaleF = 5; }
if (scaleF > 15) { scaleF = 15; }
sizeF = 2.8 - 1.5 * (scaleF - 5)/10
print(list(blocks=scaleF, textsize=sizeF))
r$blocknum = as.integer((1:nrow(r))/(nrow(r)/scaleF))
if (sum(r$blocknum == scaleF)) { r[r$blocknum == scaleF,]$blocknum = scaleF - 1; }
r[is.na(r$consensus) | r$consensus != 'N',]$secondary = NA
r$vpos = r$pos
r[is.na(r$consensus) | r$consensus != 'N',]$vpos = NA
trace=melt(r[,c("pos", "blocknum", "peakA","peakC","peakG","peakT", "vpos", "primary", "secondary")], id.vars=c("pos", "blocknum", "primary", "secondary", "vpos"))
trace$textypos = (substr(trace$primary, 1, 1) == substr(trace$variable, 5, 5))
trace[!is.na(trace$textypos) & trace$textypos==F,]$textypos = NA
trace[!is.na(trace$textypos),]$textypos = trace[!is.na(trace$textypos),]$value
trace$textySec = (substr(trace$secondary, 1, 1) == substr(trace$variable, 5, 5))
seccount = length(unique(trace$textySec)) - 1
if (seccount) {
   trace[!is.na(trace$textySec) & trace$textySec==F,]$textySec = NA
   #trace[!is.na(trace$textySec),]$textySec = trace[!is.na(trace$textySec),]$value
   trace[!is.na(trace$textySec),]$textySec = 0
}
p1 = ggplot(data=trace, aes(x=pos, y=value))
p1 = p1 + geom_vline(aes(xintercept = vpos), color="#E5F5F9", size=sizeF, na.rm=T)
p1 = p1 + geom_line(aes(color=variable, group=variable), size=0.5)
p1 = p1 + facet_wrap(~blocknum, scales="free", ncol=1, nrow=scaleF)
p1 = p1 + geom_text(aes(x=pos, y=textypos, label=primary), size=sizeF, na.rm=T)
if (seccount) {
   p1 = p1 + geom_text(aes(x=pos, y=textySec, label=secondary), size=sizeF, na.rm=T)
}
p1 = p1 + theme(axis.title.x = element_blank(), axis.text.x = element_blank(), axis.ticks.x = element_blank(), axis.title.y = element_blank(), axis.text.y = element_blank(), axis.ticks.y = element_blank(), strip.background = element_blank(), strip.text.y = element_blank(), strip.text.x = element_blank(), legend.position="none", panel.grid.major=element_blank(), panel.grid.minor=element_blank(), panel.background = element_blank(), panel.border=element_blank())
p1

# Print decomposition
dc = read.table(paste0(outpdf, ".decomp"), header=T)
ggplot(data=dc, aes(x=indel, y=decomp)) + geom_line() + geom_point() + xlab("InDel length (in bp)") + ylab("Decomposition Error") + ylim(0,max(dc$decomp))

# Plot alignments
filename=paste0(outpdf, ".align1")
textplot(readChar(filename, file.info(filename)$size))
filename=paste0(outpdf, ".align2")
textplot(readChar(filename, file.info(filename)$size))

dev.off()

