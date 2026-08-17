import { SimulationTime } from './types';

export interface ISimulationClockConfig {
  secondsPerTick?: number;
  minutesPerHour?: number;
  hoursPerDay?: number;
  daysPerMonth?: number;
  monthsPerYear?: number;
}

export class SimulationClock {
  private currentTick: number = 0;
  private readonly secondsPerTick: number;
  private readonly minutesPerHour: number;
  private readonly hoursPerDay: number;
  private readonly daysPerMonth: number;
  private readonly monthsPerYear: number;

  constructor(config: ISimulationClockConfig = {}) {
    this.secondsPerTick = config.secondsPerTick ?? 60; // 60s per tick default
    this.minutesPerHour = config.minutesPerHour ?? 60;
    this.hoursPerDay = config.hoursPerDay ?? 24;
    this.daysPerMonth = config.daysPerMonth ?? 30;
    this.monthsPerYear = config.monthsPerYear ?? 12;
  }

  public getTick(): number {
    return this.currentTick;
  }

  public getSecondsPerTick(): number {
    return this.secondsPerTick;
  }

  public advance(deltaTicks: number = 1): SimulationTime {
    if (deltaTicks < 0) {
      throw new Error('SimulationClock cannot travel backward in time');
    }
    this.currentTick += deltaTicks;
    return this.getTime();
  }

  public setTick(tick: number): SimulationTime {
    if (tick < 0) {
      throw new Error('Tick cannot be negative');
    }
    this.currentTick = tick;
    return this.getTime();
  }

  public reset(): void {
    this.currentTick = 0;
  }

  public getTime(): SimulationTime {
    const totalSeconds = this.currentTick * this.secondsPerTick;

    const secondsInMinute = 60;
    const secondsInHour = secondsInMinute * this.minutesPerHour;
    const secondsInDay = secondsInHour * this.hoursPerDay;
    const secondsInMonth = secondsInDay * this.daysPerMonth;
    const secondsInYear = secondsInMonth * this.monthsPerYear;

    const years = Math.floor(totalSeconds / secondsInYear);
    let remaining = totalSeconds % secondsInYear;

    const months = Math.floor(remaining / secondsInMonth);
    remaining = remaining % secondsInMonth;

    const days = Math.floor(remaining / secondsInDay);
    remaining = remaining % secondsInDay;

    const hours = Math.floor(remaining / secondsInHour);
    remaining = remaining % secondsInHour;

    const minutes = Math.floor(remaining / secondsInMinute);
    const seconds = remaining % secondsInMinute;

    return {
      tick: this.currentTick,
      seconds,
      minutes,
      hours,
      days,
      months,
      years,
    };
  }
}
