import { Component } from 'react';
import { Layout } from 'antd';

import MoviesList from '../MoviesList';
import './MoviesApp.css';

export default class MoviesApp extends Component {
    data = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13].map(() => ({
        title: 'The way back',
        date: 'March 5, 2020',
        tags: ['action', 'drama'],
        img: 'https://m.media-amazon.com/images/M/MV5BYjBjMTgyYzktN2U0Mi00YTJhLThkZDQtZmM1ZDlmNWMwZDQ3XkEyXkFqcGdeQXVyMDU5MDEyMA@@._V1_.jpg',
        description:
            // eslint-disable-next-line max-len
            'A former basketball all-star, who has lost his wife and family foundation in a struggle with addiction attempts to regain his soul  and salvation by becoming the coach of a disparate ethnically mixed high. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Suspendisse ex ligula, accumsan quis sodales vel, egestas eget ex. Nunc elementum a ante pulvinar volutpat. Pellentesque porta tortor sit amet felis condimentum, ac laoreet diam lobortis. Sed lectus purus, efficitur vitae sollicitudin consectetur, posuere pulvinar augue. Praesent pretium finibus est, quis vestibulum augue porta quis. Sed in bibendum purus. Cras venenatis et purus eu mollis.',
    }));

    state = {
        data: this.data,
    };

    render() {
        const { data } = this.state;
        return (
            <Layout className='moviesApp'>
                <MoviesList data={data} />;
            </Layout>
        );
    }
}
