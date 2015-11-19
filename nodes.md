pathway algorithm notes

- [x] get the filtered space list working ok
- [x] organise the main view code
- [x] make all station points show infoboxes
- [ ] fix the padding of stations within their spaces
- [ ] evenly space stations on the time within each space

functions needed:

1. given a station find out whether there is a station in this pathway and sapce at the next timepoint

2. given a station find out whether there is another station in this pathway at the same timepoint but in a different space

3. given the result of function 1 and 2, decide whether to drop down to a channel or to continue eastwards

4. given a station, decide whether this is the station in the pathway-space-time that will be on the canonical pathway path
