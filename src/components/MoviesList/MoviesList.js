import { Component } from 'react';
import { List, Spin, Alert } from 'antd';

import CardMovie from '../CardMovie';
import TheMovieDB from '../../requests/TheMovieDB';

export default class MoviesList extends Component {
    theMovieDB = new TheMovieDB();

    method = {
        popular: (sessionId, currentPage) => this.theMovieDB.getPopularMovies(sessionId, currentPage),
        search: (sessionId, currentPage) => this.theMovieDB.searchMovies(sessionId, currentPage),
        rated: (sessionId) => this.theMovieDB.getRatedMovies(sessionId),
    };

    state = {
        isLoaded: true,
        data: [],
        baseImgUrl: '',
        currentPage: null,
        method: null,
    };

    async componentDidMount() {
        const { type } = this.props;
        const newState = { method: this.method[type] };
        if (type !== 'rated') newState.currentPage = 1;

        await this.theMovieDB
            .getBaseImgUrl()
            .then((url) => {
                newState.baseImgUrl = url;
                this.setState(newState, async () => {
                    const { method } = this.state;
                    await this.getMovies(method);
                });
            })
            .catch(() => {
                this.setState({
                    baseImgUrl: false,
                });
            });
    }

    componentDidUpdate(prevProps) {
        let { search: currentSearch } = this.props;
        const { type: currentType } = this.props;
        currentSearch = currentSearch.split(' ').join('');

        if (currentType !== prevProps.type) {
            const newState = { method: this.method[currentType] };
            if (currentType !== 'rated') newState.currentPage = 1;
            this.setState(newState);
        }

        if (currentSearch && prevProps.search !== currentSearch) {
            const { currentPage } = this.state;
            this.setState(({ method }) => {
                const newMethod = this.method.search;
                const newState = {};
                if (method !== newMethod) newState.method = newMethod;
                if (currentPage !== 1) newState.currentPage = 1;
                if (Object.keys(newState).length !== 0) return newState;

                const { sessionId } = this.props;
                this.getMovies(() => method(sessionId, currentPage));
                return null;
            });
        }
    }

    getMovies = async (method) => {
        const { isLoaded, currentPage } = this.state;
        const { sessionId } = this.props;

        if (isLoaded === false) {
            this.setState({ isLoaded: true });
        }

        await method(sessionId, currentPage)
            .then((data) => {
                this.setState({
                    data,
                    isLoaded: false,
                });
            })
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
    };

    changeRating = async (id, rating) => {
        await this.theMovieDB.rateMovie(this.props.sessionId, id, rating);
    };

    render() {
        const { data, baseImgUrl, isLoaded, currentPage } = this.state;
        let res;

        if (isLoaded) {
            res = <Spin tip='Loading' />;
        } else if (!data && !isLoaded) {
            res = <Alert message='Oops' description='Sorry, something is wrong. Please try again later' type='error' />;
        } else if (data.length === 0 && !isLoaded) {
            res = <Alert message='Nothing found for your request' type='warning' />;
        } else {
            res = (
                <RenderContent
                    data={data}
                    baseImgUrl={baseImgUrl}
                    current={currentPage}
                    changePage={this.changePage}
                    changeRating={this.changeRating}
                />
            );
        }

        return res;
    }
}

function RenderContent({ data, baseImgUrl, current, changePage, changeRating }) {
    const { Item } = List;
    return (
        <List
            grid={{ gutter: 16, column: 2, xs: 1 }}
            pagination={{
                pageSize: 6,
                onChange: current ? changePage : null,
                current,
            }}
            className='movieList'
            dataSource={data}
            renderItem={(item) => (
                <Item>
                    <CardMovie
                        movie={item}
                        baseImgUrl={baseImgUrl}
                        onChangeRating={(rating) => changeRating(item.id, rating)}
                    />
                </Item>
            )}
        />
    );
}
