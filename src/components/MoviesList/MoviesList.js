import { Component } from 'react';
import { List, Spin, Alert } from 'antd';

import CardMovie from '../CardMovie';
import TheMovieDB from '../../requests/TheMovieDB';

export default class MoviesList extends Component {
    theMovieDB = new TheMovieDB();

    state = {
        isLoaded: false,
        data: [],
        baseImgUrl: '',
    };

    componentDidMount() {
        this.theMovieDB
            .getBaseImgUrl()
            .then((url) =>
                this.setState({
                    baseImgUrl: url,
                })
            )
            .catch(() => {
                this.setState({
                    baseImgUrl: false,
                });
            });
        this.searchMovies('return');
    }

    searchMovies(request) {
        const { isLoaded } = this.state;
        if (isLoaded === false) {
            this.setState({ isLoaded: true });
        }
        this.theMovieDB
            .getListOfMovies(request)
            .then((movies) =>
                this.setState({
                    data: movies,
                    isLoaded: false,
                })
            )
            .catch(() =>
                this.setState({
                    data: false,
                    isLoaded: false,
                })
            );
    }

    render() {
        const { data, baseImgUrl, isLoaded } = this.state;
        let res;

        if (!data) {
            res = <Alert message='Oops' description='Sorry, something is wrong. Please try again later' type='error' />;
        }
        if (isLoaded) {
            res = <Spin tip='Loading' />;
        }
        if (data && !isLoaded) {
            res = <RenderContent data={data} baseImgUrl={baseImgUrl} />;
        }

        return res;
    }
}

function RenderContent({ data, baseImgUrl }) {
    const { Item } = List;
    return (
        <List
            grid={{ gutter: 16, column: 2, xs: 1 }}
            pagination={{
                pageSize: 6,
            }}
            dataSource={data}
            renderItem={(item) => (
                <Item>
                    <CardMovie movie={item} baseImgUrl={baseImgUrl} />
                </Item>
            )}
        />
    );
}
