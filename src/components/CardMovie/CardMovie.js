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
        const ellipsisText = {
            rows: 6,
            expandable: false,
        };
        const ellipsisTitle = {
            rows: 3,
            expandable: false,
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

        return (
            <Card style={{ height: '279px' }} className='cardMovie' cover={cover}>
                <div className='cardMovie__header'>
                    <Title ellipsis={ellipsisTitle} level={5}>
                        {title}
                    </Title>
                    <span className='cardMovie__vote'>{voteAverage}</span>
                </div>
                {date && <Text type='secondary'>{formatDate}</Text>}
                {tagsArr && <Space>{tagsArr}</Space>}
                {description && (
                    <Paragraph className='cardMovie__description' ellipsis={ellipsisText}>
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
