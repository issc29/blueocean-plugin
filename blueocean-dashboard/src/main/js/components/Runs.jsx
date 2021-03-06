import React, { Component, PropTypes } from 'react';
import { CommitHash, ReadableDate, TimeDuration } from '@jenkins-cd/design-language';
import {
    LiveStatusIndicator,
    logging,
    ReplayButton,
    RunButton,
    TimeHarmonizer as timeHarmonizer,
} from '@jenkins-cd/blueocean-core-js';
import Extensions from '@jenkins-cd/js-extensions';

import { MULTIBRANCH_PIPELINE } from '../Capabilities';
import { buildRunDetailsUrl } from '../util/UrlUtils';
import IfCapability from './IfCapability';
import { CellLink, CellRow } from './CellLink';
import RunMessageCell from './RunMessageCell';
import RunIdCell from './RunIdCell';

const logger = logging.logger('io.jenkins.blueocean.dashboard.Runs');
/*
 http://localhost:8080/jenkins/blue/rest/organizations/jenkins/pipelines/PR-demo/runs
 */
export class Runs extends Component {
    constructor(props) {
        super(props);
        this.state = { isVisible: false };
    }

    render() {
        // early out
        if (!this.props.run || !this.props.pipeline) {
            return null;
        }
        const { router, location } = this.context;

        const { run, pipeline, t, locale, getTimes } = this.props;

        const resultRun = run.result === 'UNKNOWN' ? run.state : run.result;
        const isRunning = () => run.state === 'RUNNING' || run.state === 'PAUSED' || run.state === 'QUEUED';
        const {
            durationInMillis,
            endTime,
            startTime,
        } = getTimes({
            result: resultRun,
            durationInMillis: run.durationInMillis,
            startTime: run.startTime,
            endTime: run.endTime,
        });
        logger.warn('time:', {
            runDuration: run,
            durationInMillis,
            endTime,
            startTime,
            isRunning: isRunning(),
        });

        const runDetailsUrl = buildRunDetailsUrl(pipeline.organization, pipeline.fullName, decodeURIComponent(run.pipeline), run.id, 'pipeline');

        const openRunDetails = (newUrl) => {
            location.pathname = newUrl;
            router.push(location);
        };

        return (
        <CellRow id={`${pipeline.name}-${run.id}`} linkUrl={runDetailsUrl}>
            <CellLink>
                <LiveStatusIndicator
                  durationInMillis={durationInMillis}
                  result={resultRun}
                  startTime={startTime}
                  estimatedDuration={run.estimatedDurationInMillis}
                />
            </CellLink>
            <CellLink><RunIdCell run={run} /></CellLink>
            <CellLink><CommitHash commitId={run.commitId} /></CellLink>
            <IfCapability className={pipeline._class} capability={MULTIBRANCH_PIPELINE} >
                <CellLink linkUrl={runDetailsUrl}>{decodeURIComponent(run.pipeline)}</CellLink>
            </IfCapability>
            <CellLink><RunMessageCell run={run} t={t} /></CellLink>
            <CellLink>
                <TimeDuration
                  millis={durationInMillis}
                  updatePeriod={1000}
                  liveUpdate={isRunning()}
                  locale={locale}
                  displayFormat={t('common.date.duration.display.format', { defaultValue: 'M[ month] d[ days] h[ hours] m[ minutes] s[ seconds]' })}
                  liveFormat={t('common.date.duration.format', { defaultValue: 'm[ minutes] s[ seconds]' })}
                  hintFormat={t('common.date.duration.hint.format', { defaultValue: 'M [month], d [days], h[h], m[m], s[s]' })}
                />
            </CellLink>
            <CellLink>
                <ReadableDate
                  date={endTime}
                  liveUpdate
                  locale={locale}
                  shortFormat={t('common.date.readable.short', { defaultValue: 'MMM DD h:mma Z' })}
                  longFormat={t('common.date.readable.long', { defaultValue: 'MMM DD YYYY h:mma Z' })}
                />
            </CellLink>
            <td>
                <Extensions.Renderer extensionPoint="jenkins.pipeline.activity.list.action" {...t} />
                <RunButton
                  className="icon-button"
                  runnable={this.props.pipeline}
                  latestRun={this.props.run}
                  buttonType="stop-only"
                />
                <ReplayButton className="icon-button" runnable={pipeline} latestRun={run} onNavigation={openRunDetails} />
            </td>
        </CellRow>
        );
    }
}

const { object, string, any, func } = PropTypes;

Runs.propTypes = {
    run: object,
    pipeline: object,
    result: any.isRequired, // FIXME: create a shape
    data: string,
    locale: string,
    t: func,
    getTimes: func,
};
Runs.contextTypes = {
    config: object.isRequired,
    router: object.isRequired, // From react-router
    location: object,
};

export default timeHarmonizer(Runs);
