# The ADVANCE Outcome publications

This folder contains the network data for the ADVANCE Outcome publication co-authorship network.

## Files

* `ADVANCE_Outcome_CoAuthor_EdgeList.csv`: the edge list for an undirected network for just outcome publications.
	Note: this includes duplicates when authors publish multiple times together.  As a first pass, drop the duplicates keeping the first year in which they publish.
		'aid1' - one author id
		'aid2' - the other author id
		'PublicationId' - the publication which induced the author edges
		'Year' - the year of the edge

* `ADVANCE_Outcome_CoAuthor_AuthorInfo.csv`: the author information
	'NetworkId' - the unique identifier for each author which links to the edgelist file
	'AuthorId' - the MAG author id
	'FullName' - the authors full name
	'AffiliationName' - when it exists, the most recent affiliation for the author
	'TotalPublications' - the total number of ADVANCE publications
	'TotalCitations' - the total number of citations to ADVANCE publications
	'FirstYear' - the first year this individual appears in the network
	The following four columns are publication counts reflecting an 'expertise':
		'gender_only', 'both_other', 'intersectional', 'race_ethnicity'


## Other Files for network versions

* `ADVANCE_Outcome_CoAuthor_FullEdgeList.csv`: the edge list for an undirected network including all publications.
	Note: this includes duplicates when authors publish multiple times together.  As a first pass, drop the duplicates keeping the first year in which they publish.
		'aid1' - one author id
		'aid2' - the other author id
		'PublicationId' - the publication which induced the author edges
		'Year' - the year of the edge

* `ADVANCE_Outcome_AuthorPublication_EdgeList.csv`: the edge list for an undirected, bipartite network where one node set are the Authors and the other node set are the Publications
		'aid1' - one author id
		'PublicationId' - the publication which induced the author edges
		'Year' - the year of the edge

* `ADVANCE_Outcome_Publications.csv`: the publication information, linked using 'PublicationId'