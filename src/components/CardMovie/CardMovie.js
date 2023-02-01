import { Component } from 'react';
import { Typography, Tag, Card, Space, Skeleton, Rate } from 'antd';
import { v1 as uuidv1 } from 'uuid';
import { intlFormat, parseISO } from 'date-fns';

import './CardMovie.css';

export default class CardMovie extends Component {
    state = {
        rating: null,
    };

    componentDidMount() {
        const {
            movie: { rating },
        } = this.props;
        this.setState({ rating: +rating });
    }

    componentDidUpdate(prevProps) {
        const {
            movie: { rating: currentRating },
        } = this.props;
        const { rating: prevRating } = prevProps.movie;
        if (currentRating !== prevRating) {
            this.setState({ rating: +currentRating });
        }
    }

    render() {
        const {
            movie: { title, poster, date, description, voteAverage },
            baseImgUrl,
            onChangeRating,
        } = this.props;

        if (!title) return null;

        const { rating } = this.state;

        const { Text, Paragraph, Title } = Typography;
        const ellipsis = {
            text: {
                rows: 6,
                expandable: false,
            },
            title: {
                rows: 3,
                expandable: false,
            },
        };

        const tags = ['action', 'drama'];
        const tagsArr = tags.map((tag) => {
            return (
                <Tag style={{ textTransform: 'capitalize' }} key={uuidv1()}>
                    {tag}
                </Tag>
            );
        });

        let cover;
        if (baseImgUrl === false || !poster) {
            cover = <Skeleton.Image className='cardMovie__skeletonImg' />;
        } else {
            cover = <img alt={title} src={baseImgUrl + poster} />;
        }

        const formatDate = date
            ? intlFormat(parseISO(date), { month: 'short', day: 'numeric', year: 'numeric' }, { locale: 'en-US' })
            : '';

        let voteScale;
        if (voteAverage >= 0 && voteAverage <= 3) {
            voteScale = { borderColor: '#E90000' };
        }
        if (voteAverage > 3 && voteAverage <= 5) {
            voteScale = { borderColor: '#E97E00' };
        }
        if (voteAverage > 5 && voteAverage <= 7) {
            voteScale = { borderColor: '#E9D100' };
        }
        if (voteAverage > 7 && voteAverage <= 10) {
            voteScale = { borderColor: '#66E900' };
        }

        return (
            <Card style={{ height: '279px' }} className='cardMovie' cover={cover}>
                <div className='cardMovie__header'>
                    <Title ellipsis={ellipsis.title} level={5}>
                        {title}
                    </Title>
                    <span className='cardMovie__vote' style={voteScale}>
                        {voteAverage}
                    </span>
                </div>
                {date && <Text type='secondary'>{formatDate}</Text>}
                {tagsArr && <Space>{tagsArr}</Space>}
                {description && (
                    <Paragraph className='cardMovie__description' ellipsis={ellipsis.text}>
                        <p>{description}</p>
                    </Paragraph>
                )}
                <Rate
                    className='cardMovie__ownRating'
                    onChange={(value) => onChangeRating(value)}
                    allowHalf
                    count={10}
                    value={rating}
                />
            </Card>
        );
    }
}
