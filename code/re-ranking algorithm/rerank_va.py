# -*- coding: utf-8 -*-
import itertools
import operator
import collections
from collections import defaultdict
from collections import OrderedDict
import math

def tree():
	return defaultdict(tree)
user_movie_genre_rating = tree()
movie_list = defaultdict(dict)
user_genre = defaultdict(dict)

with open('/users/liaoqin/Desktop/Project/data/rev_score.txt', 'r') as f_in1,open('/users/liaoqin/Desktop/Project/data/movie_genre_rating.txt', 'r') as f_in2, open('/users/liaoqin/Desktop/Project/data/genre_user_rating.txt', 'r') as f_in3:
	for line in f_in1:
		line = line.strip()
		line = line.split(' ')
		user = line[0]
		movie = line[1]
		rating = float(line[2])
		# sorted_x = sorted(x.items(), key=operator.itemgetter(1))
		# dict(sorted_x) == x
		movie_list[user][movie] = rating
	print("read movie_list success!")

	for line in f_in2:
		line = line.strip()
		line = line.split(' ')
		user = line[0]
		genre = line[1]
		movie = line[2]
		rating = float(line[3])

		user_movie_genre_rating[user][movie][genre] = rating
	print("read movie_genre success!")

	for line in f_in3:
		line = line.strip()
		line = line.split(' ')
		user = line[1]
		genre = line[0]
		rating = float(line[2])

		user_genre[genre][user] = rating
	print("read user_genre success!")

# normalise relevance score
rel_score = defaultdict(dict)
for user in movie_list:
	total = 0
	for movie in movie_list[user]:
		total += movie_list[user][movie]

	for movie in movie_list[user]:
		rel_score[user][movie] =  movie_list[user][movie]/total

# graph = {}
# paras = [0.5]
# for para in paras:
# 	user_new_list = defaultdict(dict)
# 	for user in rel_score:
# 		new_list = OrderedDict()

# 		for i in range(0,10):
# 			diversity_score = {}

# 			for movie in rel_score[user]:
# 				div_score = 0

# 				if new_list.has_key(movie) == False :
					
# 					diversity_component = 0
# 					for genre in user_movie_genre_rating[user][movie]:
# 						r = user_genre[genre][user] * user_movie_genre_rating[user][movie][genre]

# 						for newmovie in new_list:
# 							if user_movie_genre_rating[user][newmovie].has_key(genre) :
# 								r = r * (1 - user_movie_genre_rating[user][newmovie][genre]);
						
# 						diversity_component += r
					
# 					div_score = (1-para) * rel_score[user][movie] + para * diversity_component
# 					diversity_score[movie] = div_score

# 			sort = sorted(diversity_score.items(), key=lambda item: item[1],reverse=True)
# 			target = OrderedDict(sort).keys()[0]
# 			new_list[target] = OrderedDict(sort)[target]

# 		user_new_list[user] = new_list

# 	total = 0.0
# 	for user in user_new_list:
# 		num_genre = 0
# 		for movie in user_new_list[user]:
# 			num_genre += len(user_movie_genre_rating[user][movie].keys())
# 		total += num_genre

# 	total = math.ceil(total/len(user_new_list.keys()))
# 	graph[para] = total


# with open('rerank_va.txt', 'w') as f_out:
# 	for k,v in graph.items():
# 		f_out.writelines(str(k) + " "+str(v));
# 		f_out.write('\n')

graph = {}
para = 0.5
user_new_list = defaultdict(dict)

new_list = OrderedDict()
user = '15'
for i in range(0,20):
	diversity_score = {}

	for movie in rel_score[user]:
		div_score = 0

		if new_list.has_key(movie) == False :
				
			diversity_component = 0
			for genre in user_movie_genre_rating[user][movie]:
				r = user_genre[genre][user] * user_movie_genre_rating[user][movie][genre]

				for newmovie in new_list:
					if user_movie_genre_rating[user][newmovie].has_key(genre) :
						r = r * (1 - user_movie_genre_rating[user][newmovie][genre]);
					
					diversity_component += r
				
			div_score = (1-para) * rel_score[user][movie] + para * diversity_component
			diversity_score[movie] = div_score

	sort = sorted(diversity_score.items(), key=lambda item: item[1],reverse=True)
	target = OrderedDict(sort).keys()[0]
	new_list[target] = OrderedDict(sort)[target]

user_new_list[user] = new_list


with open('15.txt', 'w') as f_out:
	for k in rel_score['15'].keys():
		f_out.writelines(str(k));
		f_out.write('\n')

