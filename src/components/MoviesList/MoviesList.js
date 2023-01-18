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
        currentPage: 1,
        method: (currentPage) => this.theMovieDB.getPopularMovies(currentPage),
    };

    componentDidMount() {
        const { currentPage, method } = this.state;
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
        this.getMovies(() => method(currentPage));
    }

    componentDidUpdate(prevProps) {
        let { search } = this.props;
        search = search.split(' ').join('');
        if (search && prevProps.search !== search) {
            const { currentPage } = this.state;
            this.setState(
                ({ method }) => {
                    const newMethod = () => this.theMovieDB.searchMovies(search, currentPage);
                    if (method !== newMethod) return { method: newMethod };
                    return true;
                },
                // eslint-disable-next-line react/destructuring-assignment
                () => this.getMovies(this.state.method)
            );
        }
    }

    getMovies = (method) => {
        const { isLoaded } = this.state;
        if (isLoaded === false) {
            this.setState({ isLoaded: true });
        }
        method()
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
    };

    changePage = (newPage) => {
        this.setState(({ currentPage }) => {
            if (newPage === currentPage) return false;
            return { currentPage: newPage };
        });
        const { method } = this.state;
        this.getMovies(method);
    };

    render() {
        const { data, baseImgUrl, isLoaded, currentPage } = this.state;
        let res;

        if (isLoaded) {
            res = <Spin tip='Loading' />;
        } else if (!data) {
            res = <Alert message='Oops' description='Sorry, something is wrong. Please try again later' type='error' />;
        } else if (data.length === 0) {
            res = <Alert message='Nothing found for your request' type='warning' />;
        } else {
            res = (
                <RenderContent data={data} baseImgUrl={baseImgUrl} current={currentPage} changePage={this.changePage} />
            );
        }

        return res;
    }
}

function RenderContent({ data, baseImgUrl, current, changePage }) {
    const { Item } = List;
    return (
        <List
            grid={{ gutter: 16, column: 2, xs: 1 }}
            pagination={{
                pageSize: 6,
                onChange: changePage,
                current,
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
