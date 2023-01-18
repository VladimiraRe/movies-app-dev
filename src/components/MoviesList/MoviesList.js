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

    componentDidUpdate(prevProps) {
        let { search } = this.props;
        search = search.split(' ').join('');
        if (search && prevProps.search !== search) {
            this.searchMovies(search);
        }
    }

    searchMovies(request) {
        const { isLoaded } = this.state;
        if (isLoaded === false) {
            this.setState({ isLoaded: true });
        }
        this.theMovieDB
            .getListOfMovies(request)
            .then((data) =>
                this.setState({
                    data,
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

        if (isLoaded) {
            res = <Spin tip='Loading' />;
        } else if (!data) {
            res = <Alert message='Oops' description='Sorry, something is wrong. Please try again later' type='error' />;
        } else if (data.length === 0) {
            res = <Alert message='Nothing found for your request' type='warning' />;
        } else {
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
