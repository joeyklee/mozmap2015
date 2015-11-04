library(data.table)
library(dplyr)

dt <- fread('~/code/mozmap2015/space2pathway.csv')
df <- as.data.frame(dt)

# create a balanced matrix
rownames(df) <- df$space
df <- df[,-1]

cluster <- hclust(dist(as.matrix(df)))
plot(cluster)
# cluster ordering
cluster$labels[cluster$order]

library(grid)     ## Need to attach (and not just load) grid package
library(pheatmap)

d <- as.matrix(df)

## Edit body of pheatmap:::draw_colnames, customizing it to your liking
draw_colnames_45 <- function (coln, ...) {
  m = length(coln)
  x = (1:m)/m - 1/2/m
  grid.text(coln, x = x, y = unit(0.96, "npc"), vjust = .5,
            hjust = 1, rot = 45, gp = gpar(...)) ## Was 'hjust=0' and 'rot=270'
}

## 'Overwrite' default draw_colnames with your own version
assignInNamespace(x="draw_colnames", value="draw_colnames_45",
                  ns=asNamespace("pheatmap"))

pheatmap(d, legend=F)
